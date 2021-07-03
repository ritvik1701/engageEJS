var SpeechRecognition = window.webkitSpeechRecognition;
var recognition = new SpeechRecognition();

var subscriptionKey = "ee9df74b45d04754bcc1f35b8aef63b6";
var endpoint = "https://api.cognitive.microsofttranslator.com";

// Add your location, also known as region. The default is global.
// This is required if using a Cognitive Services resource.
var location = "centralindia";

const requestTranslation = (targetLanguage, data, translatedResults) => {
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
    translatedResults.innerHTML += response.data[0].translations[0].text;
    translatedResults.scrollTop = translatedResults.scrollHeight;
  });
};

let results = document.querySelector("#sttResult");
let translatedResults = document.querySelector("#translatedResult");

export const stt = (captionButton) => {
  recognition.continuous = true;
  recognition.interimResults = false;

  recognition.onresult = (e) => {
    console.log(e.results);
    let current = e.resultIndex;
    let transcript = e.results[current][0].transcript;
    requestTranslation("hi", transcript, translatedResults);
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
    color: "green",
    duration: "2000",
  });
  recognition.stop();
};
