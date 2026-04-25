import torch
import numpy as np
from torchmetrics.image.fid import FrechetInceptionDistance
from torchmetrics.image import StructuralSimilarityIndexMeasure
from sampling import algorithm1_sample, algorithm2_sample, direct_reconstruct

# helpers
def to_uint8(x):
    return (x.clamp(0, 1) * 255).to(torch.uint8)

def to_fid(x):
    x = to_uint8(x)
    if x.shape[1]==1:
        x= x.repeat(1, 3, 1, 1)
    return x

# compute the Frechet inception dist between two batches of images
#both inputs should be tensors of shape (N, 3, H, W) with values in [0, 255]

def compute_fid(real_images, generated_images):
    device = real_images.device
    fid= FrechetInceptionDistance(feature=2048).to(device)
    fid.update(real_images, real=True)
    fid.update(generated_images, real=False)

    return fid.compute().item()

# another way of comparing similarity between two images is SSIM
def compute_ssim(image1, image2):
    device = image1.device
    ssim= StructuralSimilarityIndexMeasure(data_range= 1.0).to(device)
    return ssim(image1, image2).item()

# root squared pixel error between two images, both inputs should be tensors of the same shaepe with val in [0, 1]
def compute_rmse(image1, image2):
    return torch.sqrt(torch.mean((image1- image2) ** 2)).item()


# run all three reconstruction methods on the test set and compute metrics in a table like format.
# exactly as table 1, we have degraded, direct and sammpled (with alg1 and alg2), so one extra column!

def evaluate_model(model, degradation, test_loader, t, device= "cpu"):
    methods= ["degraded", "direct", "alg1", "alg2"]
    
    fid= {m: FrechetInceptionDistance(feature=2048).to(device) for m in methods}
    ssim= {m: StructuralSimilarityIndexMeasure(data_range= 1.0).to(device) for m in methods}
    
    sse= {m: 0.0 for m in methods}
    n_pix= {m:0 for m in methods}
    
    model.eval()
    with torch.no_grad():
        for images, _ in test_loader: 
            x_0 = images.to(device)
            x_t= degradation.forward_to_step(x_0, t)
            
            recs= {
                "degraded": x_t,
                "direct": direct_reconstruct(model, x_t, t),
                "alg1": algorithm1_sample(model, degradation, x_t, t),
                "alg2": algorithm2_sample(model, degradation, x_t, t),
            }
            
            real_u8= to_fid(x_0)
            x0_clamped= x_0.clamp(0, 1)
            
            for m, r in recs.items():
                r_clamped = r.clamp(0, 1)
                
                fid[m].update(real_u8, real= True)
                fid[m].update(to_fid(r), real= False)
                
                ssim[m].update(r_clamped, x0_clamped)
                sse[m] += torch.sum((r_clamped - x0_clamped) ** 2).item()
                n_pix[m] += x0_clamped.numel()
                
            del x_0, x_t, recs, real_u8, x0_clamped
            if device == "cuda":
                torch.cuda.empty_cache()
                
        return{
            m: {
                "fid": fid[m].compute().item(),
                "ssim": ssim[m].compute().item(),
                "rmse": (sse[m] / n_pix[m]) ** 0.5,
            }
            
            for m in methods
        }
        