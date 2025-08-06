Here is a brief synopsis of the backend machine learning implementation and history of previous unsucccessful approaches, and recommendations for future implementations 


`Training Models`
-	We trained our image similarity model using EfficientNet on 6 car check videos. The training parameters such as scaling were the same as the testing parameters found ing test_image_similarity.py. When testing, we determine a cosine similarity score to the training data in our similarity model.
-	We trained our ImageBind model on 6 car check videos as well. When testing, we determine a cosine similarity score to the training data in our similarity model.
-	We generated training transcripts using Meta AI model llama given the tags/categories of videos Police actually have. We also split our generated transcripts with real transcripts in our training data for our Transformer model

`Transcriber`
-	We adjusted thresholds for the transcriber such as minimal speech, minimum audio, and compression to improve the accuracy of the transcripts


`Decision Tree Logic`
- Based on image similarity/ combined image + imagebind similarity score, we determine if the video visually depicts a Car Check. If the transformer model predicts the video as a Traffic Stop, and it visually doesn't look like a car check, then we predict it as a Traffic Stop. Otherwise, if scores are low or the transformer prediction is unconfident or not a Traffic Stop, then we label it as Other/Unsure. Since we cannot be entirely confident in our transformer model alone, we don't allow our final prediction to be `Traffic Stop|Confident` and we only automatically tag the video as `Delete` if we predict `Car Check|Confident`


`Unsuccessful Approaches`
Throughout the past two quarters, we also experimented with the following approaches: A car siren identifier, an object detection model, a color similarity model, Resnet image similarity, LLMs for zero-shot classification on transcripts, LLMs for few-shot classification on transcripts, and a Video S3D model

-	`Car Siren Identifier`
	We worked on building a car siren identifier with a recurrent convolutional neural network that could distinguish the singular police car siren noise in some Car Check Videos and the Car siren sequence in a few other Car Check videos. The issue is that there was not enough data. With data augmentation, we either overfit the model to not be able to identify any sirens outside the training data or many false positives from regular police car sirens or simply other noises.

-	`Object Detection Model`
	We thought of either using a pretrained object detection model or training one ourselves for observing if certain items appear such as a taser, rifly, police car, police lockers, etc. that are common in Car Check videos. The issue was that running pretrained object detection models didn't necessarily have the exact objects we were looking for and also didn't perform very well at the objects they were trained for considering the time it takes to process. Training our own model may be beneficial, but we decided was not worth the time investment when these object identifiers may not be as useful as an image similarity model

-	`Resnet image similarity Model`
	Resnet simply performed worse than Efficient. Efficientnet runs much faster allowing for higher image resolution which means we can get higher accuracy at a better speed.

-	`LLMs for zero-shot or few-shot classification`
	Unlike ChatGPT with general reasoning capabilities, local LLMs are uncomparably smaller and also limited by the local machine's processing power. We found decent results, possibly better with zero-shot classification on some local LLM models designed for zero-shot classification than of our transformer model, but the size is much bigger and processing time is much slower than a transformer model which is near instant. With few-shot classification, the performance was very poor, likely due to poor training transcript data.

-	`Video S3D Model`
	This model performed worse than Efficientnet at a significantly higher performance cost. It takes much longer to train and run the model and Imagebind takes more input from videos as it takes sequences of frames and pairs them with the audio as well. The thought was a 3D convolutional neural network would capture spatiotemporal convolutions meanining it could capture patterns across multiple time and space. However, when training and testing on entire videos, its outputs weren't as useful as Imagebind or Efficientnet. A 3D CNN approach may be helpful when training on specific spatiotemporal events and running the model on a sliding window of the video being tested, but training and testing on entire videos results in a slower, worse performing model compared to an image similarity model.


`Ideas for Future Implementations`
-	LLM general reasoning capabilities are increasingly popular and rapidly improving. In the future, given the correct privacy protections, using a general reasoning LLM on the transcripts will outperform any small/local LLM and transformer model.
-	Our TA recommended an MLP approach where Image Similarity and Imagebind are trained as classification models rather than cosine similarity scores. This can be done with three classes (car stop, traffic stop, other) and level the data to have equal amounts of each. He also recommended redoing our Imagebind implementation to be more optimal summarized as follows: The core idea is to freeze a large, pre‑trained multimodal backbone (ImageBind) and train only a tiny linear head on top of the embeddings. We avoid over‑fitting while squeezing every last bit of signal from both video and audio.  Data augmentation with video: random horizontal flip, slight colour‑jitter, ±4‑frame temporal jitter, 0.9–1.1× playback speed. Data augmentation with audio: ±10 % pitch shift, light background noise, SpecAugment masks. Last, evaluate the video in chunks: Slide an 8‑second window across a test video, classify each clip, then take a majority vote over contiguous clips to mark a “car‑stop event”. Report clip‑level and event‑level F1.