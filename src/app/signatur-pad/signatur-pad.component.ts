import { Component, ViewChild, Output, Input } from '@angular/core';
import { SignaturePad } from 'angular2-signaturepad/signature-pad';
import { FileOpener } from '@ionic-native/file-opener/ngx';
import { FormGroup, FormBuilder } from '@angular/forms';
import { Platform } from '@ionic/angular';
import { HttpClient } from '@angular/common/http';
import {Plugins,CameraResultType,CameraSource,FilesystemDirectory} from '@capacitor/core';
const {Camera,Filesystem}=Plugins

import pdfMake from "pdfmake/build/pdfmake";
import pdfFonts from "pdfmake/build/vfs_fonts";
import { async } from '@angular/core/testing';
import { Content } from '@angular/compiler/src/render3/r3_ast';
pdfMake.vfs = pdfFonts.pdfMake.vfs;
@Component({
  selector: 'app-signatur-pad',
  templateUrl: './signatur-pad.component.html',
  styleUrls: ['./signatur-pad.component.scss'],
})
export class SignaturPadComponent {
  rowData={
    signature : '',
    name:""
  }
  signature = '';
  isDrawing = false;
  loadData=null
  pdfObj=null
  base64Image=null
  photoPreview=null
  @ViewChild ('signatureCanvas', {static: true}) signaturePad: SignaturePad;
  private signaturePadOptions: Object = {
    'minWidth': 2,
    'canvasWidth': 400,
    'canvasHeight': 200,
    'backgroundColor': '#f6fbff',
    'penColor': '#666a73'
  };
 
  constructor(
    private fb:FormBuilder,
    private platform: Platform,
    private fileOpener:FileOpener,
    private http:HttpClient
  ) {
  }
  ngOnInit(){
    this.loadLocalAssetTobased64()
  }
 
 
  drawComplete() {
    this.isDrawing = false;
  }
 
  drawStart() {
    this.isDrawing = true;
  }
 
  savePad() {
    this.rowData.signature = this.signaturePad.toDataURL();
    console.log(this.signature);
    
    this.signaturePad.clear();
    
  
  }
 
  clearPad() { 
    this.signaturePad.clear();
    this.rowData.signature=null
  }

  loadLocalAssetTobased64(){
    this.http.get('./assets/icon/favicon.png',{responseType:'blob'}).subscribe(res=>{
      const reader=new FileReader()
      reader.onload=()=>{
        this.loadData=reader.result
      }
      reader.readAsDataURL(res)
    })
  }

 async takePicture(){
      const image=await Camera.getPhoto({
        quality:100,
        allowEditing:false,
        resultType:CameraResultType.Base64,
        source:CameraSource.Camera
      })
      console.log(image.base64String);
      
      this.photoPreview=`data:image/png;base64,${image.base64String}`;
      

  }
  createPdf(){
    const image=this.photoPreview ? {image:this.photoPreview,width:200}:{};
    const signature=this.rowData.signature ? {image:this.rowData.signature,width:150}:{};
    let logo={}
    if(this.photoPreview){
      logo={image:this.loadData,width:50};
    }
    var docDefinition = {
      content: [
        { text: 'REMINDER', style: 'header' },
        { text: new Date().toTimeString(), alignment: 'right' },
 
        { text: 'Name', style: 'subheader' },
        { text: this.rowData.name },
 
        { text: 'Profile', style: 'subheader' },
        image,
        { text: 'Signature', style: 'subheader' },
        signature,
      ],
      styles: {
        header: {
          fontSize: 18,
          bold: true,
        },
        subheader: {
          fontSize: 14,
          bold: true,
          margin: [0, 15, 0, 0]
        },
        story: {
          italic: true,
          alignment: 'center',
          width: '50%',
        }
      }
    }
    
    this.pdfObj=pdfMake.createPdf(docDefinition)
    console.log(this.pdfObj);
    
  }
  downloadPdf(){
    this.savePad() 
    this.createPdf()
    if(this.platform.is('cordova')){
      console.log('vfdsgvdf');
      
      this.pdfObj.getBased64(async (data)=>{
        try{
          let path=`pdf/myletter_${Date.now()}.pdf`
          const result=await Filesystem.writeFile({path,data,directory:FilesystemDirectory.Documents,recursive:true})
          this.fileOpener.open(`${result.uri}`,'application/pdf')
        }
        catch(e){
          console.log('unable to read file',e);
          
        }
      })
    }else{
      console.log('this',this.pdfObj);
      
      this.pdfObj.download()
    }
  }

}
