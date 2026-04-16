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
    fid= FrechetInceptionDistance(feature=2048)
    fid.update(real_images, real=True)
    fid.update(generated_images, real=False)

    return fid.compute().item()

# another way of comparing similarity between two images is SSIM
def compute_ssim(image1, image2):
    ssim= StructuralSimilarityIndexMeasure(data_range= 1.0)
    return ssim(image1, image2).item()

# root squared pixel error between two images, both inputs should be tensors of the same shaepe with val in [0, 1]
def compute_rmse(image1, image2):
    return torch.sqrt(torch.mean((image1- image2) ** 2)).item()


# run all three reconstruction methods on the test set and compute metrics in a table like format.
# exactly as table 1, we have degraded, direct and sammpled (with alg1 and alg2), so one extra column!

def evaluate_model(model, degradation, test_loader, t):
    all_real= []
    all_degraded= []
    all_direct= []
    all_alg1= []
    all_alg2= []

    ssim_direct, ssim_alg1, ssim_alg2 = [], [],[]
    rmse_direct, rmse_alg1, rmse_alg2= [], [], []

    model.eval()
    with torch.no_grad():
        for images, _ in test_loader: 
            x_0 =images
            x_t =degradation(x_0, t)
            rec_direct= direct_reconstruct(model, x_t, t)
            
            rec_alg1= algorithm1_sample(model, degradation, x_t, t)
            rec_alg2 = algorithm2_sample(model, degradation, x_t, t)

            all_real.append(x_0)
            all_degraded.append(x_t)
            all_direct.append(rec_direct)

            all_alg1.append(rec_alg1)
            all_alg2.append(rec_alg2)

            for i in range(x_0.shape[0]):
                img_real= x_0[i].unsqueeze(0)


                ssim_direct.append(compute_ssim( rec_direct[i].unsqueeze(0), img_real))
                ssim_alg1.append(compute_ssim(rec_alg1[i].unsqueeze(0), img_real))
                ssim_alg2.append(compute_ssim(rec_alg2[i].unsqueeze(0), img_real))
                rmse_direct.append(compute_rmse(rec_direct[i], x_0[i]))
                rmse_alg1.append(compute_rmse(rec_alg1[i], x_0[i]))
                rmse_alg2.append(compute_rmse(rec_alg2[i], x_0[i]))

        all_real = torch.cat(all_real)
        all_degraded= torch.cat(all_degraded)
        all_direct= torch.cat(all_direct)
        all_alg1= torch.cat(all_alg1)
        all_alg2= torch.cat(all_alg2)

        real_fid= to_fid(all_real)
        degraded_fid = to_fid(all_degraded)
        direct_fid= to_fid(all_direct)
        alg1_fid= to_fid(all_alg1)
        alg2_fid= to_fid(all_alg2)
        
        ssim_degraded= compute_ssim(all_degraded.clamp(0, 1), all_real.clamp(0, 1))
        rmse_degraded= compute_rmse(all_degraded.clamp(0, 1), all_real.clamp(0, 1))
    return{
        "degraded":{
            "fid": compute_fid(real_fid, degraded_fid),
            "ssim": ssim_degraded, 
            "rmse": rmse_degraded,
        }, 
        "direct": {
            "fid": compute_fid(real_fid, direct_fid),
            "ssim": float(np.mean(ssim_direct)), 
            "rmse": float(np.mean(rmse_direct)),
        },
        "alg1":{
            "fid": compute_fid(real_fid, alg1_fid),
            "ssim": float(np.mean(ssim_alg1)), 
            "rmse": float(np.mean(rmse_alg1)),
        },
        "alg2":{
            "fid": compute_fid(real_fid, alg2_fid),
            "ssim": float(np.mean(ssim_alg2)), 
            "rmse": float(np.mean(rmse_alg2)),
        },


    }