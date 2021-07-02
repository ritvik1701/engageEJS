export const stt = () => {
  var SpeechRecognition = window.webkitSpeechRecognition;
  var recognition = new SpeechRecognition();

  let results = document.querySelector("#sttResult");
  recognition.continuous = true;
  recognition.interimResults = false;

  recognition.onresult = (e) => {
    let current = e.resultIndex;
    let transcript = e.results[current][0].transcript;
    results.innerHTML += transcript;
  };

  recognition.onstart = () => {
    console.log("Starting speech to text");
  };

  recognition.onerror = () => {
    console.log("Error in stt");
  };

  recognition.start();
};
