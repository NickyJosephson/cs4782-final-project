import torch
import torch.nn.functional as F
import numpy as np

# UNet expects time as a tensor of shape (B, ), not a python int

def _t_tensor(s, x):
    return torch.full((x.shape[0],), s, device=x.device, dtype=torch.long)

# Algorithm 1 from the paper, takes a degraded image and tries to recover original by working backward step by step
def algorithm1_sample(model, degradation, x_t, t):
    x_s = x_t
    for s in range(t, 0, -1):
        x_hat_0= model(x_s, _t_tensor(s, x_s))
        x_s = degradation.forward_to_step(x_hat_0, s-1)
    return x_s

# this is algorithm 2, which is improved algo for cold diffusion sampling
def algorithm2_sample(model, degradation, x_t, t):
    x_s = x_t
    for s in range(t, 0, -1):

        x_hat_0 = model(x_s, _t_tensor(s, x_s))
        x_s= x_s - degradation.forward_to_step(x_hat_0, s) + degradation.forward_to_step(x_hat_0, s-1)

    return x_s

# one-shot reconstruction

def direct_reconstruct(model,x_t, t):
    return model(x_t, _t_tensor(t, x_t))

# same as alg1 and alg2 but also returns the image at every step so we can plot drift vs stability and make trajectory figures
def sample_with_intermediates(model, degradation, x_t, t, algorithm=2): 
    intermediates= [x_t]
    x_s= x_t
    for s in range(t, 0, -1):
        x_hat_0= model(x_s, _t_tensor(s, x_s))
        if algorithm==1: 
            x_s= degradation.forward_to_step(x_hat_0, s-1)
        else: 
            x_s= x_s- degradation.forward_to_step(x_hat_0, s) + degradation.forward_to_step(x_hat_0, s-1)
        intermediates.append(x_s)
    
    return x_s, intermediates