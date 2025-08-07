SETUP INSTRUCTIONS (Windows):


Frontend Setup:

1.) For frontend you will need to have Node.js and npm installed
-	we are using node v22.16.0 and npm 10.9.2
-	to check node version in terminal: `node -v`
-	to check npm version in terminal: `npm -v`

2.) Install all npm packages by running `npm install` in your terminal (make sure it is in the SHPD-BWC-APP directory)

Backend Setup:

For backend, you will need to install all necessary Python `pip` packages, preferrably Pytorch CUDA, and preferrably do both in a virtual environment such as Conda. In `package.json` we boot up the conda environment named `py310`, so if you choose to use a separate environment, then you will need to update `package.json`.

1.) Instal Mamba, a package manager for conda with `conda install -n base -c conda-forge mamba`. Then, please create a local anaconda environment with that Python version by typing `mamba env create -f py310_env.yml` into your terminal such as powershell, as this will create the conda environment will all necessary pip packages. If this is your first time with conda, and you are using powershell, you may need to run `conda init powershell` and reopen powershell.

2.) Then download this additional package after all previous dependencies are installed with `mamba install -c conda-forge mayavi`.

3.) For Imagebind, you will need to download that from github here: `https://github.com/facebookresearch/ImageBind` and unzip it within this directory, replacing the empty ImageBind folder. Then, activate your conda environment by first typing `conda activate py310`, then once activated type `cd ImageBind` and `python -m pip install -e .`. Information on the pros and cons of toggling Imagebind can be found in `About the Application` section.

4.) Then you need to install Pytorch, and it is recommended to install it with CUDA by typing the following `pip install torch==1.13.1+cu117 torchvision==0.14.1+cu117 torchaudio==0.13.1 --extra-index-url https://download.pytorch.org/whl/cu117` as this is a  compatible Pytorch version with CUDA.

5.) Finally, you may close the terminal or type `conda deactivate` and `cd ..` to return to SHPD-BWC-App

Run the Application:

1.) To boot up the application on your local machine, all you need to do is run `npm run dev`
-	make sure that ports 4000 and 8000 are not in use, as those are hosting the frontend and backend. If they are, you make change the port numbers in package.json before running `npm run dev`.

About the Application:
- There are currently 4 pages you may navigate between: `All Videos, Upload Videos, Review Tagged Videos, and Process Progress`.
	- `All Videos` contains a table with all Uploaded Videos. You can Search for a video by title, and you can filter a video by its Tag. In each entry there is a triple dots that when clicked gives you the option to delete it. If you choose to delete it, it will be moved to your system's local trash bin. On the top right is a `Smart Delete` button that when confirmed will delete all videos with the `Delete` Tag
	- `Upload Videos` allows you to select/drag one or multiple files to be processed. It isn't actually uploading the videos anywhere, but saving their file paths and creating json objects for processing. After selecting videos, a table with the files titled `Unprocessed Videos` should appear with a `Process Videos` button and a slider, `Enable Imagebind`. Before clicking `Process Videos` you need to decide whether or not to Enable Imagebind. It is recommended not to Enable Imagebind as it takes significantly longer to process each video, and should only be enabled if there are false positives (false `Car Check|Confident` predictions). Thresholds for imagebind and imageSimilarity can also be adjusted in ensemble_model.py or ensemble_model_full.py (full includes Imagebind).
	- `Process Progress` includes all videos scheduled to be processed. One video at a time gets processed, and each time a video finishes processing, it gets assigned a prediction and will appear in `All Videos` and `Review Tagged Videos`