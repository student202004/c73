import firebase from 'firebase'
var firebaseConfig = {
    apiKey: "AIzaSyC9Z21BAlScwzst09ez9SxEvGrPALizd7E",
    authDomain: "wily-appli.firebaseapp.com",
    databaseURL: "https://wily-appli-default-rtdb.firebaseio.com",
    projectId: "wily-appli",
    storageBucket: "wily-appli.appspot.com",
    messagingSenderId: "392353601462",
    appId: "1:392353601462:web:afc1e2ef36a77f9661d317"
  };
  // Initialize Firebase
  firebase.initializeApp(firebaseConfig);

  export default firebase.firestore();