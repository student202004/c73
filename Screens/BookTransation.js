import React from 'react';
import { Text, View, TouchableOpacity, TextInput, Alert,Image, StyleSheet,KeyboardAvoidingView,ToastAndroid} from 'react-native';
import * as Permissions from 'expo-permissions';
import { BarCodeScanner } from 'expo-barcode-scanner';
import firebase from 'firebase';
import db from '../config';

export default class TransactionScreen extends React.Component {
  constructor(){
    super();
    this.state = {
      hasCameraPermissions : null,
      scanned : false,
      scannedBookId : '',
      scannedStudentId : '',
      buttonState : 'normal',
      transactionMessage : ''
    }
  }

  getCameraPermissions = async (id) =>{
    const {status}  = await Permissions.askAsync(Permissions.CAMERA);

    this.setState({
      /*status === "granted" is true when user has granted permission
        status === "granted" is false when user has not granted the permission
      */
      hasCameraPermissions : status === "granted",
      buttonState : id,
      scanned : false
    })
  }

  handleBarCodeScanned  = async ({type, data})=>{
    const { buttonState} = this.state

    if(buttonState === "BookId"){
      this.setState({
        scanned : true,
        scannedBookId : data,
        buttonState : 'normal'
      });
    }
    else if(buttonState === "StudentId"){
      this.setState({
        scanned : true,
        scannedStudentId : data,
        buttonState : 'normal'
      })
    }
  }

  initiateBookIssue = async ()=>{
    //add a transaction
    db.collection("transaction").add({
      'studentId' : this.state.scannedStudentId,
      'bookId' : this.state.scannedBookId,
      'data' : firebase.firestore.Timestamp.now().toDate(),
      'transactionType' : "Issue"
    })

    //change book status
    db.collection("books").doc(this.state.scannedBookId).update({
      'bookAvailable' : false
    })
    //change number of issued books for student
    db.collection("student").doc(this.state.scannedStudentId).update({
      'numberOfBooksIssued' : firebase.firestore.FieldValue.increment(1)
    })
    alert(" book issued");

    this.setState({
      scannedStudentId : '',
      scannedBookId: ''
    })
  }

  initiateBookReturn = async ()=>{
    //add a transaction
    db.collection("transaction").add({
      'studentId' : this.state.scannedStudentId,
      'bookId' : this.state.scannedBookId,
      'date'   : firebase.firestore.Timestamp.now().toDate(),
      'transactionType' : "Return"
    })

    //change book status
    db.collection("books").doc(this.state.scannedBookId).update({
      'bookAvailable' : true
    })

    //change book status
    db.collection("student").doc(this.state.scannedStudentId).update({
      'numberOfBooksIssued' : firebase.firestore.FieldValue.increment(-1)
    })
   alert("book returned")
    this.setState({
      scannedStudentId : '',
      scannedBookId : ''
    })
  }

  handleTransaction = async()=>{
    var transactionType= await this.bookEligibility();
    if (!transactionType){
      this.setState({
        scannedBookId:'',
        scannedStudentId:''
      })
      alert ("book does not exist in library")
    }
    else if (transactionType==="Issue"){
      var isStudentEligible= this.checkStudenteligibilityBookIsse();
      if (isStudentEligible){
        this.initiateBookIssue();
        alert("book issued by student")
      }
    }
    else{
      var isStudentEligible=this.checkStudenteligiblityBookReturn();
      if (isStudentEligible){
        this.initiateBookReturn();
        alert("book returned by student");
      }
    }
  }
  checkStudenteligibilityBookIsse=async()=>{
    var studentRef=await db.collection("student").where("studentId","==",this.state.scannedStudentId
    ).get();
    var isStudentEligible='';
    if (studentRef.docs.length==0){
      this.setState({
        scannedBookId:'',
        scannedStudentId:''
      })
      alert ("student id does not exist in database")
      isStudentEligible=false
    }
    else{
      studentRef.docs.map((docs)=>{
        var student=doc.data();
        if (student.numberOfBooksIssued <2){
          isStudentEligible=true;
        }
        else{
          isStudentEligible=false;
          this.setState({
            scannedStudentId:'',
            scannedBookId:''
          })
          alert("already isssued 2 books")
        }
      })
    }
    return isStudentEligible
  }
  checkStudenteligiblityBookReturn=async()=>{
    var transactionRef=db.collection("transaction").where
    ("bookId","==",this.state.scannedBookId).limit(1).get();
    var isStudentEligible=''
    transactionRef.doc.map((docs)=>{
      var lastBookTransaction=data.doc();
      if (lastBookTransaction.studentId===this.state.scannedStudentId){
        isStudentEligible=true;
      }
      else{
        isStudentEligible=false
        this.setState({
          scannedBookId:'',
          scannedStudentId:''
        })
        alert("this book not issued by this student")
      }
    })
    
  }
  bookEligibility=async()=>{
    var bookRef= db.collection("books").where("bookId","==",this.state.scannedBookId).get();
    var transactionType=""
    if (bookRef.docs.length==0){
      transactionType=false;
    alert("book does not exist in library");
      this.setState({
                scannedBookId:'',
                scannedStudentId:''
      })
    }
    else{
      bookRef.docs.map((doc)=>{
        var book=doc.data();
        if (book.bookAvailable){
          transactionType="Issue"
        }
        else {
          transactionType="Return"
        }
      })
    }
    return transactionType
  }

  render(){
    const hasCameraPermissions = this.state.hasCameraPermissions;
    const scanned = this.state.scanned;
    const buttonState = this.state.buttonState;

    if(buttonState !== "normal" && hasCameraPermissions){
      return(
        <BarCodeScanner
          onBarCodeScanned = {scanned ? undefined : this.handleBarCodeScanned}
          style = {StyleSheet.absoluteFillObject}
        />
      );
    }

    else if (buttonState === "normal"){
      return(
       <KeyboardAvoidingView style={styles.container } behavior ="padding" enabled >
        <View>
          <Image
            source = {require("../assets/booklogo.jpg")}
            style= {{width:200, height:200}}/>
          <Text style={{textAlign:'center', fontSize:30,}}>Wily</Text>
        </View>
        <View style={styles.inputView}>
        <TextInput
          style={styles.inputBox}
          placeholder="Book Id"
          value={this.state.scannedBookId}
          onChangeText={text=>{
              this.setState({
                  scannedBookId:text
              })
          }}/>
        <TouchableOpacity
          style={styles.scanButton}
          onPress={()=>{
            this.getCameraPermissions("BookId")
          }}>
          <Text style={styles.buttonText}>Scan</Text>
        </TouchableOpacity>
        </View>

        <View style={styles.inputView}>
        <TextInput
          style={styles.inputBox}
          placeholder="Student Id"
          value={this.state.scannedStudentId}
          onChangeText={text=>{
              this.setState({
                  scannedStudentId:text
              })
          }}/>
        <TouchableOpacity
          style={styles.scanButton}
          onPress={()=>{
            this.getCameraPermissions("StudentId")
          }}>
          <Text style={styles.buttonText}>Scan</Text>
        </TouchableOpacity>
        </View>
        <Text style={styles.transactionAlert}>{this.state.transactionMessage}</Text>
        <TouchableOpacity
          style={styles.submitButton}
          onPress={async()=>{
            var transactionMessage = this.handleTransaction();
            
          }}>
          <Text style={styles.submitButtonText}>Submit</Text>
        </TouchableOpacity>
        </KeyboardAvoidingView>
      )
    }
  }
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  displayText:{
    fontSize: 15,
    textDecorationLine: 'underline'
  },
  scanButton:{
    backgroundColor: '#2196F3',
    padding: 10,
    margin: 10
  },
  buttonText:{
    fontSize: 15,
    textAlign: 'center',
    marginTop: 10
  },
  inputView:{
    flexDirection: 'row',
    margin: 20
  },
  inputBox:{
    width: 200,
    height: 40,
    borderWidth: 1.5,
    borderRightWidth: 0,
    fontSize: 20
  },
  scanButton:{
    backgroundColor: '#66BB6A',
    width: 50,
    borderWidth: 1.5,
    borderLeftWidth: 0
  },
  submitButton:{
    backgroundColor: '#FBC02D',
    width: 100,
    height:50
  },
  submitButtonText:{
    padding: 10,
    textAlign: 'center',
    fontSize: 20,
    fontWeight:"bold",
    color: 'white'
  }
});