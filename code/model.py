import torch.nn as nn
import torch.nn.functional as F
import math
from typing import List, Tuple
import torch

"Reimplementation fo the U-Net architecuture based on DDPM U-Net (Ho et al., 2020)"


def build_unet(dataset):
    return UNet(**_UNET_CONFIGS[dataset])

_UNET_CONFIGS = {
    "mnist": dict(
        in_channels=1,
        base_channels=32,
        channel_mults=(1, 2, 4),
        num_res_blocks=2,
        attention_resolutions=(8,),  
        image_size=32,
    ),
    "cifar10": dict(
        in_channels=3,
        base_channels=64,
        channel_mults=(1, 2, 4, 8),
        num_res_blocks=2,
        attention_resolutions=(16, 8),
        image_size=32,
    ),
    "celeba": dict(
        in_channels=3,
        base_channels=64,
        channel_mults=(1, 2, 4, 8),
        num_res_blocks=2,
        attention_resolutions=(16, 8),
        image_size=64,
    ),
    "afhq": dict(                                          
        in_channels=3,                                     
        base_channels=64,                                  
        channel_mults=(1, 2, 4, 8),                        
        num_res_blocks=2,                                
        attention_resolutions=(16, 8),                     
        image_size=128,
    ),
}

class PositionalEmbedding(nn.Module) : 
    # this takes a (b,) input vector and outputs a (b, dim ) embedding vector using sinusodial enconding
    def __init__(self, dim):
        super().__init__()
        self.dimensions = dim

    def forward(self, input) : 
        half = self.dimensions //2 
        freqs = torch.exp((-math.log(10000)) * torch.arange(half, device = input.device ) / (half - 1))
        args = input[:, None].float() * freqs[None, :] # (B, 1) * ( 1, D) = (B,D)
        return torch.cat([args.sin(), args.cos()], dim=-1)



class ResBlock(nn.Module) : 
    def __init__(self, in_channels, out_channels ,time_emb_dim, dropout= 0.  ):
        super().__init__()
        self.norm1 = nn.GroupNorm(8, in_channels)
        self.conv1 = nn.Conv2d(in_channels, out_channels, kernel_size=3, padding=1)
        self.time_proj = nn.Linear(time_emb_dim, out_channels)
        self.norm2 = nn.GroupNorm(8, out_channels)
        self.conv2 = nn.Conv2d(out_channels, out_channels, kernel_size=3, padding=1)
        self.skip = nn.Conv2d(in_channels, out_channels, 1) if in_channels != out_channels else nn.Identity()
        

    def forward(self, x, t_emb) : 
        residual = x
        x = self.conv1(F.silu(self.norm1(x)))
        t_proj = self.time_proj(F.silu(t_emb))
        x = x + t_proj[:, :, None, None]
        x = self.conv2(F.silu(self.norm2(x)))
        return x + self.skip(residual)
        

class SelfAttentionBlock(nn.Module) : 
    def __init__(self, channels, num_heads=4,  groups= 8): 
        super().__init__()
        self.num_heads = num_heads
        self.head_dim = channels // num_heads
        self.norm = nn.GroupNorm(groups, channels)
        self.qkv = nn.Conv2d(channels, channels * 3, kernel_size=1)
        self.out_proj = nn.Conv2d(channels, channels, kernel_size=1)


    def forward(self,x) : 
        B, C, H, W = x.shape
        h = self.norm(x)
        qkv = self.qkv(h)
        qkv = qkv.reshape(B, 3, self.num_heads, self.head_dim, H * W)
        q, k, v = qkv.unbind(dim=1)
        q = q.transpose(-1, -2)  # (B, heads, H*W, head_dim)
        k = k.transpose(-1, -2)
        v = v.transpose(-1, -2)
        attn_out = F.scaled_dot_product_attention(q, k, v)
        attn_out = attn_out.transpose(-1, -2).reshape(B, C, H, W) # (B, heads, H*W, head_dim)
        return x + self.out_proj(attn_out)



class Downsample(nn.Module) : 
    """halves spatial dimensions via strided convolutions"""
    def __init__(self, channels: int):
        super().__init__()
        self.conv = nn.Conv2d(channels, channels, kernel_size=4, stride=2, padding=1)

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        return self.conv(x)

class Upsample(nn.Module):
    """doubles spatial dimensions via nearest-neighbor interpolation + 3x3 conv"""
    def __init__(self, channels: int):
        super().__init__()
        self.conv = nn.Conv2d(channels, channels, kernel_size=3, padding=1)

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        x = F.interpolate(x, scale_factor=2, mode="nearest")
        return self.conv(x)



class UNet(nn.Module) : 
    def __init__(self, 
        in_channels = 3, 
        base_channels = 64, 
        channel_mults = (1, 2, 4, 8), 
        num_res_blocks = 2,
        attention_resolutions = (16, 8),
        time_emb_dim = None,
        num_heads = 4,
        groups= 8,
        image_size = 32,
    ):
        super().__init__()
        self.image_size = image_size
        if time_emb_dim == None: 
            time_emb_dim = base_channels * 4
            
        self.time_mlp = nn.Sequential(
            PositionalEmbedding(base_channels),
            nn.Linear(base_channels, time_emb_dim),
            nn.SiLU(),
            nn.Linear(time_emb_dim, time_emb_dim),
        )
        self.init_conv = nn.Conv2d(in_channels, base_channels, kernel_size=3, padding=1)
        self.down_blocks = nn.ModuleList()
        self.up_blocks = nn.ModuleList()
        channels_list = [base_channels]
        current_channels = base_channels
        current_resolution = image_size

        #encoder
        for idx, mult in enumerate(channel_mults):
            out_ch = base_channels * mult
            is_last_stage = (idx == len(channel_mults) - 1)
            stage_modules = nn.ModuleList()
            for _ in range(num_res_blocks):
                stage_modules.append(ResBlock(current_channels, out_ch, time_emb_dim, groups))
                current_channels = out_ch
                if current_resolution in attention_resolutions:
                    stage_modules.append(SelfAttentionBlock(current_channels, num_heads, groups))
                channels_list.append(current_channels)

            if not is_last_stage:
                stage_modules.append(Downsample(current_channels))
                channels_list.append(current_channels)
                current_resolution //= 2

            self.down_blocks.append(stage_modules)

        # middle 
        self.mid_block1 = ResBlock(current_channels, current_channels, time_emb_dim, groups)
        self.mid_attn = SelfAttentionBlock(current_channels, num_heads, groups)
        self.mid_block2 = ResBlock(current_channels, current_channels, time_emb_dim, groups)

        # decoder 
        for idx, mult in enumerate(reversed(channel_mults)):
            out_ch = base_channels * mult
            is_last_stage = (idx == len(channel_mults) - 1)

            stage_modules = nn.ModuleList()
            for _ in range(num_res_blocks + 1):
                skip_channels = channels_list.pop()
                stage_modules.append(
                    ResBlock(current_channels + skip_channels, out_ch, time_emb_dim, groups)
                )
                current_channels = out_ch
                if current_resolution in attention_resolutions:
                    stage_modules.append(SelfAttentionBlock(current_channels, num_heads, groups))

            if not is_last_stage:
                stage_modules.append(Upsample(current_channels))
                current_resolution *= 2
            self.up_blocks.append(stage_modules)

        self.out_norm = nn.GroupNorm(groups, current_channels)
        self.out_conv = nn.Conv2d(current_channels, in_channels, kernel_size=3, padding=1)

        
    def forward(self,x,t) : 
        t_emb = self.time_mlp(t)
        x = self.init_conv(x)
        skips = [x] 
        #encoder
        for stage in self.down_blocks:
            for module in stage:
                if isinstance(module, ResBlock):
                    x = module(x, t_emb)
                    skips.append(x)
                elif isinstance(module, SelfAttentionBlock):
                    x = module(x)
                    skips[-1] = x
                elif isinstance(module, Downsample):
                    x = module(x)
                    skips.append(x)

        #middle
        x = self.mid_block1(x, t_emb)
        x = self.mid_attn(x)
        x= self.mid_block2(x, t_emb)

        #decoder
        for stage in self.up_blocks:
            for module in stage:
                if isinstance(module, ResBlock):
                    skip = skips.pop()
                    x = torch.cat([x, skip], dim=1)
                    x = module(x, t_emb)
                elif isinstance(module, SelfAttentionBlock):
                    x = module(x)
                elif isinstance(module, Upsample):
                    x = module(x)

        x = F.silu(self.out_norm(x))
        return self.out_conv(x)






