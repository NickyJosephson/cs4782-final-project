import copy
import pathlib
import torch
import torch.nn.functional as F
from torch.optim import Adam
from data.datasets import get_loader
from model import build_unet
from degradation import Degradation

# config per dataset
DEGRADATION_CONFIGS= {
    "mnist": dict(kernel_size= 11, num_timesteps= 20, kernel_std= 7.0, blur_routine= "Constant", image_channels= 1),
    "cifar10": dict(kernel_size= 11, num_timesteps= 50, kernel_std= 0.1, blur_routine= "Special6", image_channels= 3),
    "celeba": dict(kernel_size= 15, num_timesteps= 200, kernel_std= 0.01, blur_routine= "Exponential_Reflect", image_channels= 3),
}

# main train loop
def train (dataset_name, num_steps= 100_000, lr= 2e-5, batch_size= 32, grad_accum_steps= 2, ema_decay= 0.995, ema_update_every= 10, log_every= 500, save_every= 5000, ckpt_dir= "../checkpoints", data_percent = 1, resume= False, device= None, discrete= False):
    device = device or ("cuda" if torch.cuda.is_available() else "cpu")
    print(f"[train] dataset= {dataset_name} device= {device}")

    # data, model and degradation
    loader= get_loader(dataset_name, "train", batch_size=batch_size, num_workers= 2, data_percent= data_percent, shuffle= True)
    deg_cfg= DEGRADATION_CONFIGS[dataset_name].copy()
    if discrete: 
        deg_cfg.update(dict(
            kernel_size= 27, num_timesteps= 300, kernel_std= 0.01, blur_routine= "Exponential"
        ))
    T = deg_cfg["num_timesteps"]
    degradation= Degradation(**deg_cfg).to(device)
    model= build_unet(dataset_name).to(device)
    ema_model= copy.deepcopy(model)

    for p in ema_model.parameters():
        p.requires_grad_(False)

    optimizer= Adam(model.parameters(), lr= lr)

    #resume if needed
    suffix = "_gen" if discrete else ""
    ckpt_path= pathlib.Path(ckpt_dir) / f"{dataset_name}{suffix}.pt"
    start_step= 0
    loss_history= []
    if resume and ckpt_path.exists(): 
        ckpt = torch.load(ckpt_path, map_location = device)
        model.load_state_dict(ckpt["model"])
        ema_model.load_state_dict(ckpt["ema"])
        optimizer.load_state_dict(ckpt["optimizer"])
        start_step= ckpt.get("step", 0)
        loss_history = ckpt.get("loss_history", [])
        print(f"[train] resumed from step {start_step}")

    ckpt_path.parent.mkdir(parents=True, exist_ok= True)
    # training loop
    model.train()
    data_iter= iter(loader)
    running_loss= 0.0

    for step in range(start_step, num_steps):
        optimizer.zero_grad()

        for _ in range(grad_accum_steps):
            try: 
                images, _ = next(data_iter)
            except StopIteration: 
                data_iter = iter(loader)
                images, _ = next(data_iter)

            x_0= images.to(device)
            B = x_0.shape[0]

            t_batch = torch.randint(1, T+1, (B, ), device= device)

            x_t= torch.stack([
                degradation.forward_to_step(x_0[i:i+1], int(t_batch[i])).squeeze(0)
                for i in range(B)
            ])
            
            if discrete: 
                is_max_t= (t_batch == T)
                if is_max_t.any():
                    means= x_t[is_max_t].mean(dim=(2,3), keepdim= True)
                    x_t[is_max_t] = means.expand_as(x_t[is_max_t])

            x_hat_0 = model(x_t, t_batch)
            loss= F.l1_loss(x_hat_0, x_0) / grad_accum_steps

            loss.backward()
            running_loss += loss.item()

        optimizer.step()

        #ema update
        if (step + 1) % ema_update_every == 0:
            with torch.no_grad():
                for p_ema, p in zip(ema_model.parameters(), model.parameters()):
                    p_ema.mul_(ema_decay).add_(p, alpha= 1 - ema_decay)

        if (step + 1) % log_every == 0: 
            avg= running_loss / log_every

            loss_history.append((step+ 1, avg))
            print(f" [train] step= {step+1:>7} loss= {avg:.4f}")
            running_loss= 0.0
        
        # checkpoint
        if ((step + 1) % save_every ) == 0: 
            torch.save({
                "model": model.state_dict(),
                "ema": ema_model.state_dict(),
                "optimizer": optimizer.state_dict(),
                "step": step + 1,
                "loss_history": loss_history,
                "dataset": dataset_name,
            }, ckpt_path)

            print(f"[train] saved ckpt at step {step + 1}")
        
    # final save
    torch.save({
        "model": model.state_dict(),
        "ema": ema_model.state_dict(),
        "optimizer": optimizer.state_dict(),
        "step": num_steps,
        "loss_history": loss_history,
        "dataset": dataset_name,
    }, ckpt_path)
    print(f"[train] done.")

    return loss_history

        


