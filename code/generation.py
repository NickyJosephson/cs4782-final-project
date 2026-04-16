import torch
import numpy as np
from sklearn.mixture import GaussianMixture
from sampling import algorithm2_sample

# fit a guassian mixture on the channel-wise mean RGB of very trianing image. 
# this is used as the prior we ample flat_color images from for generation
def fit_gmm(train_loader, n_components=1):
    means= []
    for images, _ in train_loader: 
        #images: (B, 3, H, W) in [0, 1]
        batch_means= images.mean(dim=(2,3))
        means.append(batch_means.cpu().numpy())
    
    means= np.concatenate(means, axis=0)
    gmm= GaussianMixture(n_components=n_components, covariance_type= "full")

    gmm.fit(means)
    return gmm

# sample colors from gmm and expand to flat-color images, add an option for symmetry breaking noise (for comparison)
# run algorithm2 to deblur them into generated images
def generate_image(model, degradation, gmm, t, image_shape, n_samples=1, add_noise= False, device= "cpu"):
    C,H,W= image_shape
    colors,_ = gmm.sample(n_samples)
    colors= torch.from_numpy(colors).float().to(device)
    # need to clamp since model was trained on inputs in [0, 1]
    colors= colors.clamp(0, 1)

    #expand each rgb to a flat (3, h, w) image
    x_t= colors.view(n_samples, C, 1, 1).expand(n_samples, C, H, W).contiguous()

    # 0.002 is the noise they used
    if add_noise:
        x_t= x_t + torch.randn_like(x_t) * 0.002

    model.eval()
    with torch.no_grad():
        generated= algorithm2_sample(model, degradation, x_t, t)
    
    return generated
