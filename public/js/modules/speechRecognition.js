let SpeechRecognition = window.webkitSpeechRecognition;
let recognition = new SpeechRecognition();

let subscriptionKey = process.env.SUBSCRIPTION_KEY;
let endpoint = "https://api.cognitive.microsofttranslator.com";

// Add your location, also known as region. The default is global.
// This is required if using a Cognitive Services resource.
let location = process.env.LOCATION;

const requestTranslation = (
  targetLanguage,
  data,
  translatedResults,
  socket
) => {
  axios({
    baseURL: endpoint,
    url: "/translate",
    method: "post",
    headers: {
      "Ocp-Apim-Subscription-Key": subscriptionKey,
      "Ocp-Apim-Subscription-Region": location,
      "Content-type": "application/json",
      "X-ClientTraceId": uuid.v4().toString(),
    },
    params: {
      "api-version": "3.0",
      from: "en",
      to: [`${targetLanguage}`],
    },
    data: [
      {
        text: `${data}`,
      },
    ],
    responseType: "json",
  }).then(function (response) {
    let translation = response.data[0].translations[0].text;
    translatedResults.innerHTML += translation;
    translatedResults.scrollTop = translatedResults.scrollHeight;
    socket.emit("gotTranslation", { data, translation });
  });
};

let results = document.querySelector("#sttResult");
let translatedResults = document.querySelector("#translatedResult");

export const stt = (captionButton, socket, lang) => {
  console.log("In stt");
  recognition.continuous = true;
  recognition.interimResults = false;

  recognition.onresult = (e) => {
    console.log(e.results);
    let current = e.resultIndex;
    let transcript = e.results[current][0].transcript;
    requestTranslation(lang, transcript, translatedResults, socket);
    results.innerHTML += transcript;
    results.scrollTop = results.scrollHeight;
    // console.log(e.results[0]);
  };

  recognition.onstart = () => {
    console.log("Starting speech to text");
    ohSnap("Starting live captions", {
      color: "green",
      duration: "2000",
    });
  };

  recognition.onerror = (e) => {
    console.log("Error in stt: ", e);
    if (e.error == "no-speech") {
      ohSnap("Captions disabled due to inactivity", {
        color: "yellow",
        duration: "2000",
      });
      captionButton.classList.remove("selected");
      captionButton.classList.add("deselected");
    } else if (e.error == "network") {
      ohSnap("Error: Feature currently only on Google Chrome!", {
        color: "yellow",
        duration: "3000",
      });
      captionButton.classList.remove("selected");
      captionButton.classList.add("deselected");
      sttStop();
    } else {
      ohSnap("Error while starting Live Captions", {
        color: "yellow",
        duration: "3000",
      });
    }
  };

  recognition.onspeechend = () => {
    console.log("Speech ended");
    captionButton.classList.remove("selected");
    captionButton.classList.add("deselected");
    // ohSnap("Captions disabled due to inactivity", {
    //   color: "yellow",
    //   duration: "2000",
    // });
  };

  recognition.start();
};

export const sttStop = () => {
  ohSnap("Live captions stopped", {
    color: "red",
    duration: "2000",
  });
  recognition.stop();
};
