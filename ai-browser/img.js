async function generateImage(PROMPT) {
  try {
    const API_KEY = "0000000000";

    const headers = {
      "apikey": API_KEY,
      "Client-Agent": "img-generator/1.0"
    };

    const response = await axios.post(
      "https://stablehorde.net/api/v2/generate/async",
      {
        prompt: PROMPT,
        params: {
          n: 1,
          width: 512,
          height: 512, 
          steps: 20,
          sampler_name: "k_lms"
        },
        nsfw: false,
        censor_nsfw: true,
        models: ["stable_diffusion"]
      },
      { headers }
    );

    if (response.status === 200 || response.status === 202) {
      const requestId = response.data.id;

      const statusResponse = await new Promise((resolve, reject) => {
        const interval = setInterval(async () => {
          try {
            const statusRes = await axios.get(
              `https://stablehorde.net/api/v2/generate/status/${requestId}`,
              { headers }
            );

            if (statusRes.data.done) {
              clearInterval(interval);
              resolve(statusRes.data);
            }
          } catch (error) {
            clearInterval(interval);
          }
        }, 5000);
      });

      const generations = statusResponse.generations;
      if (generations && generations.length > 0) {
        const imgUrl = generations[0].img;
        return imgUrl;
      } else {
        return false;
      }
    } else {
      return false;
    }
  } catch (error) {
    return false;
  }
}

async function main() {
  const imgUrl = await generateImage("Bitcoin");
  console.log(imgUrl);
}

main();
