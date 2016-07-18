/**************************************************/
/*                                                */
/*   iResEditor.js                                */
/*                                      v1.00     */
/*                                                */
/*   Copyright 2016 Takeshi Okamoto (Japan)       */
/*                                                */
/*   Released under the MIT license               */
/*   http://www.petitmonte.com/labo/iResEditor/   */
/*                                                */
/*                            Date: 2016-07-15    */
/**************************************************/

////////////////////////////////////////////////////////////////////////////////
// Generic function
////////////////////////////////////////////////////////////////////////////////

// byte配列を文字列に変換(NULL無)
function PE_Byte2String(PByteArray){
  var result = '';
  
  for(var i=0;i<PByteArray.length;i++){
    // NULLはスルー
    if(PByteArray[i] === 0) continue;
    result += String.fromCharCode(PByteArray[i]);
  }  
  return result;
}

// byte配列を文字列に変換(NULL有)
function PE_Byte2StringN(PByteArray){
  var result = '';
  
  for(var i=0;i<PByteArray.length;i++){
    result += String.fromCharCode(PByteArray[i]);
  }  
  return result;
}

// byte配列をWordに変換
function PE_Byte2Word(PByteArray){  
  return (PByteArray[1] << 8 | PByteArray[0]);
}

// byte配列をDWordに変換
function PE_Byte2DWord(PByteArray){
  // NOTE : JavaScriptは符号ありの32bitでシフトをするので[ >>> 0 ]で符号をなしにしています。
  return ((PByteArray[3] << 24 | PByteArray[2] << 16 | PByteArray[1] << 8 |  PByteArray[0]) >>> 0) ;
}

// byte配列をQWordに変換
// NOTE : JavaScriptの整数はdouble型で53bitが最大ですので、54bit以上の値は正常に動作しません。 
function PE_Byte2QWord(PByteArray){
  return ((PByteArray[7] << 56 | PByteArray[6] << 48 | PByteArray[5] << 40 |  PByteArray[4] << 32 |
           PByteArray[3] << 24 | PByteArray[2] << 16 | PByteArray[1] <<  8 |  PByteArray[0]) >>> 0) ;
}

// 整数から16進数へ変換
// value: 整数 digits:桁数(DWordならば8)
function PE_IntToHex(value,digits){
 var result = value.toString(16).toUpperCase();
 var len = result.length;
 
 for(var i=len;i<digits;i++){
  result = '0' + result;
 }
 
 return '0x' + result; 
}

// 4byte境界のパディング
function PE_PaddingDword(Stream){
  var padding = Math.floor((Stream.getFileSize() + 3) / 4) * 4;
  
  for(var i=Stream.getFileSize();i<padding;i++){ 
    Stream.WriteByte(0);
  }   
}

// ストリームから文字列を取得(終端がNULL) StringZero = "sz" type
function PE_getStringZero(Stream,Size){
  var P = '',C;
  
  // Ascii
  if(Size === 1){
    while(true){
      if(Stream.Pos >= Stream.FileSize) throw '[PE_getStringZero]:Reached the end of the file.';
      C = Stream.Read(1)[0];
      if(C === 0) break;
      P += String.fromCharCode(C);
    }
  
  // Unicode  
  }else if(Size === 2){
    while(true){
      if(Stream.Pos >= Stream.FileSize) throw '[PE_getStringZero]:Reached the end of the file.';
      C = PE_Byte2Word(Stream.Read(2));
      if(C === 0) break;
      P += String.fromCharCode(C);
    }
  }
  return P;
}

// 文字列をストリームへ書き込む(終端がNULL) StringZero = "sz" type
function PE_setStringZero(Stream,Str){
  for(var i=0;i<Str.length;i++){
    Stream.WriteWord(Str.charCodeAt(i));
  }
  Stream.WriteWord(0); 
}
  
// 文字列のエスケープシーケンス
function PE_EscapeSequence(str){
  return str.replace(/"/g , '""').
             replace(/\\/g , '\\\\').  
             replace(/\r/g , '\\r').
             replace(/\n/g , '\\n').
             replace(/\t/g , '\\t');
}

// 文字列をファイルで使用できる文字に変換する
function PE_ConvertCanUseChar(str,alternate){
  // 使用できない文字
  // \ / ? : * " > < |  
  return (str+'').replace(/(\\|\/|\?|\:|\*|"|>|<|\|)/g,alternate);
}

// Ascii文字列をUint8Array配列に変換
function PE_ConvertArray(str){
  var pByteArray = new Uint8Array(str.length);
  
  for(var i=0;i<str.length;i++){
    pByteArray[i] = str.charCodeAt(i) & 0xFF;
  } 
  return pByteArray;
}

// リソースが「Binary or String」か判定する
// true : Binary,false : String
function PE_resTypeIsBinary(resType){
  
  if(typeof resType === "string"){
    
    if(resType.toUpperCase() === "XML"){
      return false;
    }else if(resType.toUpperCase() === "XSD"){
      return false;      
    }else if(resType.toUpperCase() === "XSDFILE"){
      return false; 
    }else if(resType.toUpperCase() === "XSLFILE"){
      return false;                            
    }else if(resType.toUpperCase() === "REGISTRY"){
      return false;      
    }else if(resType.toUpperCase() === "LIBRARY"){
      return false; 
    }else if(resType.toUpperCase() === "RT_RIBBON_XML"){
      return false;
    }else{
      return true;
    }

  }else{
    switch(resType){
      case   1: return true;  // Cursor
      case   2: return true;  // Bitmap
      case   3: return true;  // Icon
      case   4: return true;  // Menu
      case   5: return true;  // Dialog
      case   6: return true;  // String Table
      case   7: return true;  // Font Directory
      case   8: return true;  // Font
      case   9: return true;  // Accelerator
      case  10: return true;  // RCData
      case  11: return true;  // Message Table
      case  12: return true;  // Cursor Group
      case  14: return true;  // Icon Group
      case  16: return true;  // Version Info
      case  17: return true;  // Dialog Include
      case  19: return true;  // Plug and Play
      case  20: return true;  // VXD
      case  21: return true;  // Animation Cursor
      case  22: return true;  // Animation Icon
      case  23: return false; // HTML
      case  24: return false; // Manifest
      case  28: return false; // Ribbon
      case 241: return true;  // Toolbar      
    }
  }
  return true;
}

////////////////////////////////////////////////////////////////////////////////
// Generic Class
////////////////////////////////////////////////////////////////////////////////

// ---------------------
//  TReadStream            
// ---------------------
function TReadStream(AStream) {
  this.Pos = 0;
  this.Stream = AStream;
  this.FileSize = AStream.length;
}

// ---------------------
//  TReadStream.Method     
// ---------------------
TReadStream.prototype = {

  Read: function (ReadByteCount) {
    var P = this.Stream.subarray(this.Pos, this.Pos + ReadByteCount);
    this.Pos = this.Pos + ReadByteCount;
    return P;
  },

  ReadString: function (ReadByteCount) {
    var P = String.fromCharCode.apply(
             null, this.Stream.subarray(this.Pos, this.Pos + ReadByteCount));
    this.Pos = this.Pos + ReadByteCount;
    return P;
  }
}  

// ---------------------
//  TFileStream            
// ---------------------
function TFileStream(BufferSize) {

  if (BufferSize == undefined)
    this.MemorySize = 5000000; // 5M
  else
    this.MemorySize = parseInt(BufferSize, 10);

  this.Size = 0;
  this.Stream = new Uint8Array(this.MemorySize);
}

// ---------------------
//  TFileStream.Method     
// ---------------------
TFileStream.prototype = {

  _AsciiToUint8Array: function (S) {
    var len = S.length;
    var P = new Uint8Array(len);
    for (var i = 0; i < len; i++) {
      P[i] = S[i].charCodeAt(0) & 0xFF;
    }
    return P;
  },

  WriteByte: function (value) {
    var P = new Uint8Array(1);
    
    P[0] = value;
    
    this.WriteStream(P);      
  },
  
  WriteWord: function (value) {
    var P = new Uint8Array(2);
    
    P[1] = (value & 0xFF00) >> 8;
    P[0] = (value & 0x00FF);  
    
    this.WriteStream(P);      
  },

  WriteDWord: function (value) {
    var P = new Uint8Array(4);
    
    P[3] = (value & 0xFF000000) >> 24;
    P[2] = (value & 0x00FF0000) >> 16;
    P[1] = (value & 0x0000FF00) >> 8;
    P[0] = (value & 0x000000FF);  
    
    this.WriteStream(P);      
  },
  
  WriteQWord: function (value) {
    var P = new Uint8Array(8);
    
    // Not supported(53 bit only)
    P[7] = (value & 0xFF00000000000000) >> 56;
    P[6] = (value & 0x00FF000000000000) >> 48;
    P[5] = (value & 0x0000FF0000000000) >> 40;
    P[4] = (value & 0x000000FF00000000) >> 32;    
    P[3] = (value & 0x00000000FF000000) >> 24;
    P[2] = (value & 0x0000000000FF0000) >> 16;
    P[1] = (value & 0x000000000000FF00) >> 8;
    P[0] = (value & 0x00000000000000FF);  
    
    this.WriteStream(P);      
  },
    
  WriteString: function (S) {
    var P = this._AsciiToUint8Array(S);

    // メモリの再編成
    if (this.Stream.length <= (this.Size + P.length)) {
      var B = new Uint8Array(this.Stream);
      this.Stream = new Uint8Array(this.Size + P.length + this.MemorySize);
      this.Stream.set(B.subarray(0, B.length));
    }

    this.Stream.set(P, this.Size);
    this.Size = this.Size + P.length;
  },

  WriteStream: function (AStream) {      
    
    // メモリの再編成
    if (this.Stream.length <= (this.Size + AStream.length)) {
      var B = new Uint8Array(this.Stream);
      this.Stream = new Uint8Array(this.Size + AStream.length + this.MemorySize);
      this.Stream.set(B.subarray(0, B.length));
    }

    this.Stream.set(AStream, this.Size);
    this.Size = this.Size + AStream.length;
  },

  getFileSize: function () {
    return this.Size;
  },

  SaveToFile: function (FileName,type) {
    if (window.navigator.msSaveBlob) {
      window.navigator.msSaveBlob(new Blob([this.Stream.subarray(0, this.Size)], { type: type }), FileName);
    } else {
      var a = document.createElement("a");
      a.href = URL.createObjectURL(new Blob([this.Stream.subarray(0, this.Size)], { type: type }));
      //a.target   = '_blank';
      a.download = FileName;
      document.body.appendChild(a); //  FF specification
      a.click();
      document.body.removeChild(a); //  FF specification
    }
  },
}

////////////////////////////////////////////////////////////////////////////////
// Resource Encode(*.res)
////////////////////////////////////////////////////////////////////////////////

// ---------------------------
//  TResEncode            
// ---------------------------
function TResEncode() {}

// ---------------------------
//  TResEncode.Method     
// ---------------------------
TResEncode.prototype = {
  
  // RESファイルの生成
  SaveToStream : function (resType,resName,AStream){    
    var F = new TFileStream(100000);
    
    // 32byteのヘッダ
    F.WriteDWord(0); F.WriteDWord(0x20); F.WriteDWord(0xFFFF);  F.WriteDWord(0xFFFF);
    F.WriteDWord(0); F.WriteDWord(0);    F.WriteDWord(0);       F.WriteDWord(0);
    
    // データサイズ
    F.WriteDWord(AStream.length);
    
    // ヘッダ-サイズ(後で)
    F.WriteDWord(0);
           
    // リソースタイプ      
    if(typeof resType === 'string'){  
      
      // Ribbon
      if(resType === 'RT_RIBBON_XML'){
        // ID  
        F.WriteWord(0xFFFF);
        F.WriteWord(28);
      }else{      
        // 文字列
        for(var i=0;i<resType.length;i++){
          F.WriteWord(resType.charCodeAt(i));          
        }
        F.WriteWord(0); // NULL      
      }
    }else{
      // ID  
      F.WriteWord(0xFFFF);
      F.WriteWord(resType);
    }    
        
    // リソース名    
    if(typeof resName === 'string'){        
      // 文字列
      for(var i=0;i<resName.length;i++){
        F.WriteWord(resName.charCodeAt(i));          
      }
      F.WriteWord(0); // NULL      
    }else{
      // ID
      F.WriteWord(0xFFFF);
      F.WriteWord(resName);
    }    
  
    // 4バイト境界のパディング数の算出
    var padding = 0;
    var size = F.getFileSize();
    if(size % 4 !== 0){
      padding = Math.floor((size +4 ) / 4) * 4 - size;        
      padding = padding /2;                    
    }
    
    // パディングの書き込み
    for(var i=0;i<padding;i++){
      F.WriteWord(0);          
    }        
    
    // データバージョン(常に0)
    F.WriteDWord(0);
    
    // メモリフラグ
    F.WriteWord(0);
    
    // 言語(User default locale language)
    F.WriteWord(0x0400); 
    
    // リソースのバージョン番号(ユーザー定義)
    F.WriteDWord(0);

    // 特性
    F.WriteDWord(0);
    
    // ヘッダーサイズ
    var nowsize =  F.getFileSize() - 32;  
    F.Stream[36] = (nowsize & 0x000000FF);
    F.Stream[37] = (nowsize & 0x0000FF00) >> 8;
    F.Stream[38] = (nowsize & 0x00FF0000) >> 16;
    F.Stream[39] = (nowsize & 0xFF000000) >> 24;
    
    // RAWデータの書き込み
    F.WriteStream(AStream);
        
    return F.Stream.subarray(0, F.getFileSize());
  },
  
  // RESファイルの生成
  SaveToFile : function (FileName,resType,resName,AStream){   
    var F = new TFileStream(100000);
    F.WriteStream(this.SaveToStream(resType,resName,AStream));   
    F.SaveToFile(FileName);
  }
}

////////////////////////////////////////////////////////////////////////////////
// Resource Script Encode(*.rc)
////////////////////////////////////////////////////////////////////////////////

// ---------------------------
//  TStringRCEncode            
// ---------------------------
function TStringRCEncode() {} 

// ---------------------------
//  TStringRCEncode.Method     
// ---------------------------
TStringRCEncode.prototype = {
  
  SaveToStream : function (resString){    
    var P = 'STRINGTABLE\r\n';
    
    P += '{\r\n';
    for(var i=0;i<resString.ID.length;i++){
      if(resString.Value[i] !== ''){
        P += resString.ID[i] +',  ' +
             '"' + PE_EscapeSequence(resString.Value[i]) + '"\r\n';      
      }           
    } 
    P += '}\r\n';    
    
    // UTF8をUTF16に変換
    var F = new TFileStream(50000);
    F.WriteWord(0xFEFF); // UTF-16LEのBOM
    for(var i=0;i<P.length;i++){
      F.WriteWord(P.charCodeAt(i));
    }   
    return F.Stream.subarray(0, F.getFileSize());
  },
  
  SaveToFile : function (FileName,resString){           
    var F = new TFileStream(50000);
    F.WriteStream(this.SaveToStream(resString));   
    F.SaveToFile(FileName);
  }         
}

// ---------------------------
//  TMessageRCEncode            
// ---------------------------
// CAUTION : This RC File is can not read, because the format is different. 
//         : The correct format is [ nameID MESSAGETABLE filename ]
//         : Please use in the display. 
function TMessageRCEncode() {}

// ---------------------------
//  TMessageRCEncode.Method     
// ---------------------------
TMessageRCEncode.prototype = {
  
  SaveToStream : function (resName,resMessage){    
    var P = resName + ' MESSAGETABLE\r\n';
    
    P += '{\r\n';
    for(var i=0;i<resMessage.Message_Resource_Block.length;i++){
      // 最小ID
      var ID = resMessage.Message_Resource_Block[i].LowId;
      for(var j=0;j<resMessage.Message_Resource_Block[i].Message_Resource_Entry.length;j++){
        // メッセージ        
        var Text = resMessage.Message_Resource_Block[i].Message_Resource_Entry[j].Text;
        P += '0x' + ID.toString(16).toUpperCase() +',  ' +
             '"' +  PE_EscapeSequence(Text) + '"\r\n';  
        ID++;         
      }
    } 
    P += '}\r\n';    
    
    // UTF8をUTF16に変換
    var F = new TFileStream(50000);
    F.WriteWord(0xFEFF); // UTF-16LEのBOM
    for(var i=0;i<P.length;i++){
      F.WriteWord(P.charCodeAt(i));
    }   
    return F.Stream.subarray(0, F.getFileSize());
  },
  
  SaveToFile : function (FileName,resName,resMessage){           
    var F = new TFileStream(50000);
    F.WriteStream(this.SaveToStream(resName,resMessage));   
    F.SaveToFile(FileName);
  }         
}

// ---------------------------
//  TDialogRCEncode            
// ---------------------------
function TDialogRCEncode() {}

// ---------------------------
//  TDialogRCEncode.Method     
// ---------------------------
TDialogRCEncode.prototype = {
  
  // ウインドウクラス(コントロール)
  _getWindowClass : function (windowClass){ 
    var wClass = {
                    BUTTON    : 0x0080,
                    EDIT      : 0x0081,
                    STATIC    : 0x0082,
                    LISTBOX   : 0x0083,
                    SCROLLBAR : 0x0084,
                    COMBOBOX  : 0x0085
                  };      

      if(typeof windowClass === 'string'){
        return '"' + windowClass + '"';
      }else{        
        for(var key in wClass){
          if (windowClass === wClass[key]){
            return key;
          } 
        }
      }
      // IUnknown
      return windowClass;    
  },  
  
  SaveToStream : function (resName,resDialog){    
    var P = resName + ' ';    

    // -------------------
    //  [通常版](旧式)
    // -------------------
    if(resDialog.DlgTemplate){
      P += 'DIALOG ';
      
      // サイズ
      P += resDialog.DlgTemplate.x  + ',' +
           resDialog.DlgTemplate.y  + ',' +
           resDialog.DlgTemplate.cx + ',' +
           resDialog.DlgTemplate.cy + '\r\n';
      
      // スタイル           
      P += 'STYLE 0x' + resDialog.DlgTemplate.style.toString(16).toUpperCase() + '\r\n';
      
      // 拡張スタイル
      if(resDialog.DlgTemplate.dwExtendedStyle !== 0){
        P += 'EXSTYLE 0x' + resDialog.DlgTemplate.dwExtendedStyle.toString(16).toUpperCase() + '\r\n';
      }
      
      // タイトル           
      if(typeof resDialog.DlgTemplate.title === "string"){
        P += 'CAPTION "' + PE_EscapeSequence(resDialog.DlgTemplate.title) + '"\r\n';
      }else{
        P += 'CAPTION ""\r\n';
      }
      
      // メニュー
      if(resDialog.DlgTemplate.menu !== 0){
        if(typeof resDialog.DlgTemplate.menu === "string"){
          P += 'MENU "' + PE_EscapeSequence(resDialog.DlgTemplate.menu) + '"\r\n';
        }else{
          P += 'MENU "' + resDialog.DlgTemplate.menu.toString(16).toUpperCase() + '"\r\n';
        }
      }
      
      // フォント
      if(resDialog.DlgTemplate.typeface){
        P += 'FONT ' + resDialog.DlgTemplate.pointsize +',' + 
             '"'+ resDialog.DlgTemplate.typeface +'"' + '\r\n';
      }
      
      P += '{\r\n';
      for(var i=0;i<resDialog.DlgTemplate.cdit;i++){
        P += '  CONTROL ';
        
        // タイトル
        if(typeof resDialog.DlgItemTemplate[i].title === "string"){
          P += '"'+ PE_EscapeSequence(resDialog.DlgItemTemplate[i].title) +'",';
        }else{
          if(resDialog.DlgItemTemplate[i].title === 0){
            P += '"",';
          }else{
            P += resDialog.DlgItemTemplate[i].title + ',';
          }
        }
        
        // コントロールID
        if(resDialog.DlgItemTemplate[i].id  === 0xFFFF){
          P += '-1,';
        }else{
          P += resDialog.DlgItemTemplate[i].id + ',';
        }
        
        // コントロールの種類
        P += this._getWindowClass(resDialog.DlgItemTemplate[i].windowClass) + ',';   
        
        // スタイル     
        P += '0x' + resDialog.DlgItemTemplate[i].style.toString(16).toUpperCase() + ','; 
        
        // サイズ
        P += resDialog.DlgItemTemplate[i].x  + ',' +
             resDialog.DlgItemTemplate[i].y  + ',' +
             resDialog.DlgItemTemplate[i].cx + ',' +
             resDialog.DlgItemTemplate[i].cy + '\r\n';
      }
      P += '}\r\n';
      
    // -------------------
    //  [拡張版]
    // -------------------
    }else{
      P += 'DIALOGEX '; 
      
      // サイズ
      P += resDialog.DlgTemplateEx.x  + ',' +
           resDialog.DlgTemplateEx.y  + ',' +
           resDialog.DlgTemplateEx.cx + ',' +
           resDialog.DlgTemplateEx.cy + '\r\n';
      
      // スタイル           
      P += 'STYLE 0x' + resDialog.DlgTemplateEx.style.toString(16).toUpperCase() + '\r\n';
      
      // 拡張スタイル
      if(resDialog.DlgTemplateEx.exStyle !== 0){
        P += 'EXSTYLE 0x' + resDialog.DlgTemplateEx.exStyle.toString(16).toUpperCase() + '\r\n';
      }
      
      // タイトル           
      if(typeof resDialog.DlgTemplateEx.title === "string"){
        P += 'CAPTION "' + PE_EscapeSequence(resDialog.DlgTemplateEx.title) + '"\r\n';
      }else{
        P += 'CAPTION ""\r\n';
      }
      
      // メニュー
      if(resDialog.DlgTemplateEx.menu !== 0){
        if(typeof resDialog.DlgTemplateEx.menu === "string"){
          P += 'MENU "' + PE_EscapeSequence(resDialog.DlgTemplateEx.menu) + '"\r\n';
        }else{
          P += 'MENU "' + resDialog.DlgTemplateEx.menu.toString(16).toUpperCase() + '"\r\n';
        }
      }
      
      // フォント
      if(resDialog.DlgTemplateEx.typeface){
        P += 'FONT ' + resDialog.DlgTemplateEx.pointsize +',' + 
             '"'+ resDialog.DlgTemplateEx.typeface +'",' + 
             resDialog.DlgTemplateEx.weight +',' +
             resDialog.DlgTemplateEx.italic +',' +
             resDialog.DlgTemplateEx.charset +'\r\n';
      }
      
      P += '{\r\n';
      for(var i=0;i<resDialog.DlgTemplateEx.cDlgItems;i++){
        P += '  CONTROL ';
        
        // タイトル
        if(typeof resDialog.DlgItemTemplateEx[i].title === "string"){
          P += '"'+ PE_EscapeSequence(resDialog.DlgItemTemplateEx[i].title) +'",';
        }else{
          if(resDialog.DlgItemTemplateEx[i].title === 0){
            P += '"",';
          }else{
            P += resDialog.DlgItemTemplateEx[i].title + ',';
          }
        }
        
        // コントロールID
        if(resDialog.DlgItemTemplateEx[i].id  === 0xFFFF){
          P += '-1,';
        }else{
          P += resDialog.DlgItemTemplateEx[i].id + ',';
        }
        
        // コントロールの種類
        P += this._getWindowClass(resDialog.DlgItemTemplateEx[i].windowClass) + ',';   
        
        // スタイル     
        P += '0x' + resDialog.DlgItemTemplateEx[i].style.toString(16).toUpperCase() + ','; 
        
        // サイズ
        P += resDialog.DlgItemTemplateEx[i].x  + ',' +
             resDialog.DlgItemTemplateEx[i].y  + ',' +
             resDialog.DlgItemTemplateEx[i].cx + ',' +
             resDialog.DlgItemTemplateEx[i].cy + '\r\n';
      }
      P += '}\r\n';           
    }    
    
    // UTF8をUTF16に変換
    var F = new TFileStream(50000);
    F.WriteWord(0xFEFF); // UTF-16LEのBOM
    for(var i=0;i<P.length;i++){
      F.WriteWord(P.charCodeAt(i));
    }   
    return F.Stream.subarray(0, F.getFileSize());
  },
  
  SaveToFile : function (FileName,resName,resDialog){           
    var F = new TFileStream(50000);
    F.WriteStream(this.SaveToStream(resName,resDialog));   
    F.SaveToFile(FileName);
  }
}

// ---------------------------
//  TMenuRCEncode            
// ---------------------------
function TMenuRCEncode() {}

// ---------------------------
//  TMenuRCEncode.Method     
// ---------------------------
TMenuRCEncode.prototype = {

  _space : function (count){  
    var P = '';
    for(var i=0;i<count;i++){
      P += ' ';
    }
    return P;
  },
  
  SaveToStream : function (resName,resMenu){    
    var MF_POPUP   = 0x10; // ポップアップ
    var MF_END     = 0x80; // ポップアップの終了
    var MFT_POPUP  = 0x01; // ポップアップ
    var MFT_END    = 0x80; // ポップアップの終了
    
    var P = resName + ' ';    
    
    // -------------------
    //  [通常版](旧式)
    // -------------------
    if(resMenu.MenuHeader){  
      P += 'MENU\r\n'; 
      P += '{\r\n'; 
      
      var level = -1; 
      var brackets = 0; // 括弧
      for(var i=0;i<resMenu.Items.length;i++){
        
        // 階層が1段階UP
        if((resMenu.Items[i].menuFlg & MF_POPUP) === MF_POPUP){ 
          P += this._space((resMenu.Items[i].level+1)*2);
          P += 'POPUP "' + PE_EscapeSequence(resMenu.Items[i].menuText) + '"\r\n';

          P += this._space((resMenu.Items[i].level+1)*2);
          P += '{\r\n';
          
          brackets++;
          level = resMenu.Items[i].level;
          continue;
        }
        
        // メニューアイテム
        P += this._space((resMenu.Items[i].level+1)*2);
        if(resMenu.Items[i].menuText === '-'){
          // セパレータ
          P += 'MENUITEM SEPARATOR\r\n' ;
        }else{
          // アイテム
          P += 'MENUITEM "' + PE_EscapeSequence(resMenu.Items[i].menuText) +'",';
          P += resMenu.Items[i].menuID;          
          
          if((resMenu.Items[i].menuFlg & 0x0001) === 0x0001){ P += ',GRAYED'; }
          if((resMenu.Items[i].menuFlg & 0x0002) === 0x0002){ P += ',INACTIVE'; }
          if((resMenu.Items[i].menuFlg & 0x0004) === 0x0004){ P += ',BITMAP'; }
          if((resMenu.Items[i].menuFlg & 0x0008) === 0x0008){ P += ',CHECKED'; }
          if((resMenu.Items[i].menuFlg & 0x0020) === 0x0020){ P += ',MENUBARBREAK'; }
          if((resMenu.Items[i].menuFlg & 0x0040) === 0x0040){ P += ',MENUBREAK'; }
          if((resMenu.Items[i].menuFlg & 0x0100) === 0x0100){ P += ',OWNERDRAW'; }

          P += '\r\n';   
        }

        // 階層が1段階DOWN
        if((resMenu.Items[i].menuFlg & MF_END) === MF_END){
          // トップレベルがセパレータのみ(POPUPなし)
          if(brackets !== 0){
            P += this._space((resMenu.Items[i].level)*2);
            P += '}\r\n';
            brackets--;
          }
        }        
        level = resMenu.Items[i].level;
      }   
      
      
      for(var i=0;i<brackets;i++){
        P += this._space((level-1)*2);
        P += '}\r\n';  
        level--;
      }      
      P += '}\r\n';
       
    // -------------------
    //  [拡張版] 
    // -------------------
    }else{
      P += 'MENUEX\r\n'; 
      P += '{\r\n'; 
      
      var level = -1; 
      var brackets = 0; // 括弧
      for(var i=0;i<resMenu.Items.length;i++){
        
        // 階層が1段階UP
        if((resMenu.Items[i].menuFlg & MFT_POPUP) === MFT_POPUP){ 
          P += this._space((resMenu.Items[i].level+1)*2);
          // セパレータ
          if(resMenu.Items[i].menuText === '-'){
            P += 'POPUP "",';
          // 文字列  
          }else{
            P += 'POPUP "' + PE_EscapeSequence(resMenu.Items[i].menuText) + '"'+ ',';
          }
          P += resMenu.Items[i].menuID   + ',';
          P += resMenu.Items[i].dwType   + ',';
          P += resMenu.Items[i].dwState  + ',';
          P += resMenu.Items[i].dwHelpId + '\r\n';
          
          P += this._space((resMenu.Items[i].level+1)*2);
          P += '{\r\n';
          
          brackets++;
          level = resMenu.Items[i].level;
          continue;
        }
        
        // メニューアイテム
        P += this._space((resMenu.Items[i].level+1)*2);

        if(resMenu.Items[i].menuText === '-'){
          // セパレータ
          P += 'MENUITEM "",';
        }else{
          // 文字列
          P += 'MENUITEM "' + PE_EscapeSequence(resMenu.Items[i].menuText) +'",';
        }

        P += resMenu.Items[i].menuID + ',' ;          
        P += resMenu.Items[i].dwType + ',';
        P += resMenu.Items[i].dwState;
        P += '\r\n';

        // 階層が1段階DOWN
        if((resMenu.Items[i].menuFlg & MFT_END) === MFT_END){
          // トップレベルがセパレータのみ(POPUPなし)
          if(brackets !== 0){
            P += this._space((resMenu.Items[i].level)*2);
            P += '}\r\n';
            brackets--;
          }
        }        
        level = resMenu.Items[i].level;
      }   
      
      for(var i=0;i<brackets;i++){
        P += this._space((level-1)*2);
        P += '}\r\n';  
        level--;
      }      
      P += '}\r\n';      
    }
      
    // UTF8をUTF16に変換
    var F = new TFileStream(50000);
    F.WriteWord(0xFEFF); // UTF-16LEのBOM
    for(var i=0;i<P.length;i++){
      F.WriteWord(P.charCodeAt(i));
    }   
    return F.Stream.subarray(0, F.getFileSize());
  },
  
  SaveToFile : function (FileName,resName,resMenu){           
    var F = new TFileStream(50000);
    F.WriteStream(this.SaveToStream(resName,resMenu));   
    F.SaveToFile(FileName);
  }
}

////////////////////////////////////////////////////////////////////////////////
// Compiled Resource Decode(*.bin)
////////////////////////////////////////////////////////////////////////////////

// ---------------------------
//  TStringResDecode            
// ---------------------------
function TStringResDecode() {}

// ---------------------------
//  TStringResDecode.Method     
// ---------------------------
TStringResDecode.prototype = {

  LoadFromStream : function (AStream,resID){    
    var result ={'ID': new Array,'Value':new Array()};

    this.Stream = new TReadStream(AStream);
    
    var count = 0;
    while (true){
      if(this.Stream.Pos > this.Stream.FileSize) throw '[TStringResDecode]:Reached the end of the file.';
      var length = PE_Byte2Word(this.Stream.Read(2));
      
      // NULL
      if(length === 0){
         // ソフトでは未使用の文字列/IDとなる
         result.ID[result.ID.length] = ((resID-1) << 4) + count;
         result.Value[result.Value.length] = '';   
         count++;
                        
         if(this.Stream.Pos === this.Stream.FileSize) break; 
         continue;
      }
      
      var P = '';
      for(var i=0;i<length;i++){
        P += String.fromCharCode(PE_Byte2Word(this.Stream.Read(2)));
      }
      result.ID[result.ID.length] = ((resID-1) << 4) + count;
      result.Value[result.Value.length] = P;   
      count++;
      
      if(this.Stream.Pos === this.Stream.FileSize) break;      
    }
    return result;
  }
}

// ---------------------------
//  TMessageResDecode            
// ---------------------------
function TMessageResDecode() {}

// ---------------------------
//  TMessageResDecode.Method     
// ---------------------------
TMessageResDecode.prototype = {

  LoadFromStream : function (AStream){   
    this.Stream = new TReadStream(AStream);
    
    // Message_Resource_Data構造体
    var result ={'NumberOfBlocks': PE_Byte2DWord(this.Stream.Read(4)),
                 'Message_Resource_Block':new Array()};
    
    // Message_Resource_Block構造体の列挙
    for(var i=0;i<result.NumberOfBlocks;i++){
      result.Message_Resource_Block[i] = {
        'LowId'  : PE_Byte2DWord(this.Stream.Read(4)),         // 最小のメッセージID
        'HighId' : PE_Byte2DWord(this.Stream.Read(4)),         // 最大のメッセージID
        'OffsetToEntries' : PE_Byte2DWord(this.Stream.Read(4)) // Message_Resource_Entryのエントリの位置
      };
      result.Message_Resource_Block[i]['Message_Resource_Entry'] = new Array();
    }
    
    // Message_Resource_Entry構造体の列挙
    for(var i=0;i<result.NumberOfBlocks;i++){ 
      
      // ファイルポインタの移動
      this.Stream.Pos = result.Message_Resource_Block[i].OffsetToEntries; 
      
      // Message_Resource_Entryの個数分のメッセージを取得する
      var len = result.Message_Resource_Block[i].HighId - result.Message_Resource_Block[i].LowId + 1;
      for(var j=0;j<len;j++){
        result.Message_Resource_Block[i]['Message_Resource_Entry'][j] = {
          'Length' : PE_Byte2Word(this.Stream.Read(2)), // この構造体を含めた全体サイズ
          'Flags'  : PE_Byte2Word(this.Stream.Read(2))  // 文字コードフラグ Unicode(0x0001) Ascii(0x0000)
        };
        
        // Unicode(0x0001)
        var P;  
        if(result.Message_Resource_Block[i]['Message_Resource_Entry'][j].Flags === 0x0001){
          P = PE_getStringZero(this.Stream,2);

        // Ascii(0x0000)
        // ※このタイプは実データが無いため、確認できていません。  
        }else{
           P = PE_getStringZero(this.Stream,1);     
        }    
        
        // 4byte境界のパディングをスキップする
        if(this.Stream.Pos % 4 !== 0){
          this.Stream.Pos = Math.floor((this.Stream.Pos +4 ) / 4) * 4;
        }

        result.Message_Resource_Block[i]['Message_Resource_Entry'][j]['Text'] = P;            
      }
    }
    return result;
  }
}

// ---------------------------
//  TDialogResDecode            
// ---------------------------
function TDialogResDecode() {}

// ---------------------------
//  TDialogResDecode.Method     
// ---------------------------
TDialogResDecode.prototype = {
  
  // 「Sz or Ord型」の取得 ※ SZ(String + Zero) or Ordinal value
  getSZorOrdinal : function (Stream){ 
    var value = PE_Byte2Word(Stream.Read(2));

    // メニュー/クラス/コントロールタイトルなし
    if(value === 0x00000){
      // ダイアログの場合は事前定義されているダイアログクラスとなる
      return 0x00000;
    // メニューID/クラスID/アイコンID 
    }else if(value === 0xFFFF){ 
      // コントロールIDの例 
      // Button:0x0080,Edit:0x0081,Static:0x0082,Listbox:0x0083,Scrollbar:0x0084,Combo box:0x0085
      return PE_Byte2Word(Stream.Read(2));        
    }else{
      // メニュー名/クラス名/コントロールタイトル名
      Stream.Pos = Stream.Pos - 2;
      return PE_getStringZero(Stream,2);
    }            
  },  
       
  LoadFromStream : function (AStream){    
    var DS_SETFONT = 64; // DS_SHELLFONTも含まれる 
    
    var result = '';    
    this.Stream = new TReadStream(AStream);
    
    var magic = PE_Byte2DWord(this.Stream.Read(4));
    
    // -------------------------
    //  [拡張版]
    // -------------------------
    if(magic === 0xFFFF0001){
      
      // -------------------------
      //  DlgTemplateEx
      // -------------------------
      var DlgTemplateEx = {
        'dlgVer'   : 0x0001,  // バージョン(常に1)
        'signature': 0xFFFF,  // 拡張版フラグ(0xFFFF)
        'helpID'   : PE_Byte2DWord(this.Stream.Read(4)), // ヘルプID
        'exStyle'  : PE_Byte2DWord(this.Stream.Read(4)), // 拡張スタイル(定数 WS_EX_xxx)
        'style'    : PE_Byte2DWord(this.Stream.Read(4)), // スタイル(定数 WS_xxx / DS_xxx)
        'cDlgItems': PE_Byte2Word(this.Stream.Read(2)),  // コントロール数,
        'x'        : PE_Byte2Word(this.Stream.Read(2)),  // X座標
        'y'        : PE_Byte2Word(this.Stream.Read(2)),  // Y座標
        'cx'       : PE_Byte2Word(this.Stream.Read(2)),  // width
        'cy'       : PE_Byte2Word(this.Stream.Read(2)),  // height        
        'menu'         : this.getSZorOrdinal(this.Stream), // メニュー
                                                           // ※文字列型はメニュー名。数値型はメニューID。0x0000はメニューなし
        'windowClass'  : this.getSZorOrdinal(this.Stream), // ウインドウクラス 
                                                           // ※文字列型はクラス名。数値型はクラスID。0x0000は事前定義のダイアログクラスを使用
        'title'        : PE_getStringZero(this.Stream,2)   // タイトル
      };
      
      // ウインドウにフォントが含まれる場合
      if((DlgTemplateEx['style'] & DS_SETFONT) === DS_SETFONT){
        DlgTemplateEx['pointsize'] = PE_Byte2Word(this.Stream.Read(2));  // フォントのポイントサイズ 
        DlgTemplateEx['weight']    = PE_Byte2Word(this.Stream.Read(2));  // フォントのウェイト(設定できるが自動的に0となる) 
        DlgTemplateEx['italic']    = this.Stream.Read(1)[0];          // フォントの斜体(true(1)/false(0)) 
        DlgTemplateEx['charset']   = this.Stream.Read(1)[0];          // フォントの文字セット(定数 xxx_CHARSET) ※デフォルトはDEFAULT_CHARSET=1
        DlgTemplateEx['typeface']  = PE_getStringZero(this.Stream,2); // フォント名                               
      }     

      // -------------------------
      //  DlgItemTemplateEx
      // -------------------------
      var DlgItemTemplateEx = new Array();
      for(var i=0;i<DlgTemplateEx.cDlgItems;i++){

        // 4byte境界のパディングをスキップする
        if(this.Stream.Pos % 4 !== 0){
          this.Stream.Pos = Math.floor((this.Stream.Pos +4 ) / 4) * 4;
        }

        DlgItemTemplateEx[i] ={
          'helpID'   : PE_Byte2DWord(this.Stream.Read(4)), // ヘルプID
          'exStyle'  : PE_Byte2DWord(this.Stream.Read(4)), // 拡張スタイル(定数 WS_EX_xxx)
          'style'    : PE_Byte2DWord(this.Stream.Read(4)), // スタイル(定数 WS_xxx / Common Control Stylesの定数)
          'x'        : PE_Byte2Word(this.Stream.Read(2)),  // X座標
          'y'        : PE_Byte2Word(this.Stream.Read(2)),  // Y座標
          'cx'       : PE_Byte2Word(this.Stream.Read(2)),  // width
          'cy'       : PE_Byte2Word(this.Stream.Read(2)),  // height
          'id'       : PE_Byte2DWord(this.Stream.Read(4)),  // コントロールID                       
          'windowClass'  : this.getSZorOrdinal(this.Stream),  // ウインドウクラス 
                                                              // ※文字列型はコントロール名。数値型はコントロールIDとなる
          'title'        : this.getSZorOrdinal(this.Stream),  // コントロールのタイトル
                                                              // ※文字列型はタイトル名。数値型はアイコンIDとなる
          'extraCount'   : PE_Byte2Word(this.Stream.Read(2)), // 次のlParamDataのデータサイズ ※extraCountの2byteは含まない
          'lParamData'   : new Array()                        // WM_CREATEメッセージのlParamパラメータ
        };
        
        // lParamData
        if(DlgItemTemplateEx[i].extraCount !== 0){
          DlgItemTemplateEx[i].lParamData = this.Stream.Read(DlgItemTemplateEx[i].extraCount);
        }      
      }           
      return {'DlgTemplateEx': DlgTemplateEx,'DlgItemTemplateEx':DlgItemTemplateEx};
   
    // -------------------------
    //  [通常版](旧式)
    // -------------------------
    }else{
      this.Stream.Pos = this.Stream.Pos -4 ;
      
      // -------------------------
      //  DlgTemplate
      // -------------------------
      var DlgTemplate = {
        'style'            : PE_Byte2DWord(this.Stream.Read(4)),  // スタイル(定数 WS_xxx / DS_xxx)
        'dwExtendedStyle'  : PE_Byte2DWord(this.Stream.Read(4)),  // 拡張スタイル(定数 WS_EX_xxx)
        'cdit'             : PE_Byte2Word(this.Stream.Read(2)),   // コントロール数,
        'x'                : PE_Byte2Word(this.Stream.Read(2)),   // X座標
        'y'                : PE_Byte2Word(this.Stream.Read(2)),   // Y座標
        'cx'               : PE_Byte2Word(this.Stream.Read(2)),   // width
        'cy'               : PE_Byte2Word(this.Stream.Read(2)),   // height        
        'menu'             : this.getSZorOrdinal(this.Stream),    // メニュー
                                                                  // ※文字列型はメニュー名。数値型はメニューID。0x0000はメニューなし
        'windowClass'      : this.getSZorOrdinal(this.Stream), // ウインドウクラス 
                                                               // ※文字列型はクラス名。数値型はクラスID。0x0000は事前定義のダイアログクラスを使用
        'title'            : PE_getStringZero(this.Stream,2)   // タイトル
      };
      
      // ウインドウにフォントが含まれる場合
      if((DlgTemplate['style'] & DS_SETFONT) === DS_SETFONT){
        DlgTemplate['pointsize'] = PE_Byte2Word(this.Stream.Read(2));  // フォントのポイントサイズ 
        DlgTemplate['typeface']  = PE_getStringZero(this.Stream,2);    // フォント名                               
      }     

      // -------------------------
      //  DlgItemTemplate
      // -------------------------
      var DlgItemTemplate = new Array();
      for(var i=0;i<DlgTemplate.cdit;i++){

        // 4byte境界のパディングをスキップする
        if(this.Stream.Pos % 4 !== 0){
          this.Stream.Pos = Math.floor((this.Stream.Pos +4 ) / 4) * 4;
        }

        DlgItemTemplate[i] ={
          'style'            : PE_Byte2DWord(this.Stream.Read(4)),   // スタイル(定数 WS_xxx / Common Control Stylesの定数)
          'dwExtendedStyle'  : PE_Byte2DWord(this.Stream.Read(4)),   // 拡張スタイル(定数 WS_EX_xxx)
          'x'                : PE_Byte2Word(this.Stream.Read(2)),    // X座標
          'y'                : PE_Byte2Word(this.Stream.Read(2)),    // Y座標
          'cx'               : PE_Byte2Word(this.Stream.Read(2)),    // width
          'cy'               : PE_Byte2Word(this.Stream.Read(2)),    // height
          'id'               : PE_Byte2Word(this.Stream.Read(2)),    // コントロールID                       
          'windowClass'      : this.getSZorOrdinal(this.Stream),  // ウインドウクラス 
                                                                  // ※文字列型はコントロール名。数値型はコントロールIDとなる
          'title'            : this.getSZorOrdinal(this.Stream),  // コントロールのタイトル
                                                                  // ※文字列型はタイトル名。数値型はアイコンIDとなる
          'extraCount'       : PE_Byte2Word(this.Stream.Read(2)), // 次のlParamDataのデータサイズ ※extraCountの2byteを含む
          'lParamData'       : new Array()                        // WM_CREATEメッセージのlParamパラメータ
        };
        
        // lParamData
        if(DlgItemTemplate[i].extraCount !== 0){
          DlgItemTemplate[i].lParamData = this.Stream.Read(DlgItemTemplate[i].extraCount - 2);
        }      
      }           
      return {'DlgTemplate': DlgTemplate,'DlgItemTemplate':DlgItemTemplate};      
    }
  }
}  

// ---------------------------
//  TMenuResDecode            
// ---------------------------
function TMenuResDecode() {}

// ---------------------------
//  TMenuResDecode.Method     
// ---------------------------
TMenuResDecode.prototype = {
  
  LoadFromStream : function (AStream){   
    var MF_POPUP   = 0x10; // ポップアップ
    var MF_END     = 0x80; // ポップアップの終了
    var MFT_POPUP  = 0x01; // ポップアップ
    var MFT_END    = 0x80; // ポップアップの終了
            
    var result = '';    
    this.Stream = new TReadStream(AStream);
    
    // メニューのバージョン
    var version = PE_Byte2Word(this.Stream.Read(2));
    
    // -------------------------
    //  [拡張版]
    // -------------------------
    if(version === 0x0001){

      // メニューテンプレートヘッダ
      var Menuex_Template_Header = {
        'wVersion' : version,                            // バージョン
        'wOffset'  : PE_Byte2Word(this.Stream.Read(2)),  // オフセット        
        'dwHelpId' : PE_Byte2DWord(this.Stream.Read(4))  // ヘルプID
      };
      
      var level = 0;           // 階層レベル
      var Items = new Array(); // メニューアイテム 
      
      while(true){
        if(this.Stream.Pos >= this.Stream.FileSize) throw '[TMenuResDecode]:Reached the end of the file.';      
        
        var Menuex_Template_Item ={
          'dwType'   : PE_Byte2DWord(this.Stream.Read(4)),  // アイテムの種類(定数 MFT_xxx)
          'dwState'  : PE_Byte2DWord(this.Stream.Read(4)),  // アイテムの状態(定数 MFS_xxx)
          'menuID'   : PE_Byte2DWord(this.Stream.Read(4)),  // メニューID
          'menuFlg'  : PE_Byte2Word(this.Stream.Read(2)),   // メニューフラグ
          'menuText' : PE_getStringZero(this.Stream,2)      // メニュー文字列
        };
        
        // セパレータ
        if(Menuex_Template_Item.menuText === ''){
          Menuex_Template_Item.menuText = '-';
        }
        
        // 4byte境界のパディングをスキップする
        if(this.Stream.Pos % 4 !== 0){
          this.Stream.Pos = Math.floor((this.Stream.Pos +4 ) / 4) * 4;
        }
        
        //ドロップダウンメニューまたはサブメニューのヘルプID
        if((Menuex_Template_Item.menuFlg & 0x01) === 0x01){          
          Menuex_Template_Item['dwHelpId'] = PE_Byte2DWord(this.Stream.Read(4)); 
        }
        
        Menuex_Template_Item['level'] = level;        
        Items[Items.length] = Menuex_Template_Item;

        // 階層のインクリメント(次のメニューアイテムから)
        if((Menuex_Template_Item.menuFlg & MFT_POPUP) === MFT_POPUP){
          level++;
        }
                
        // 階層のデクリメント(次のメニューアイテムから)
        if((Menuex_Template_Item.menuFlg & MFT_END) === MFT_END){
          if(((Menuex_Template_Item.menuFlg & MFT_POPUP) !== MFT_POPUP)){          
            level--;
          }
        }
                
        // 終端
        if((Menuex_Template_Item.menuFlg & MF_END) === MF_END){ 
           if(this.Stream.Pos === this.Stream.FileSize){
              break;        
           }
        }  
      }

      return {'Menuex_Template_Header':Menuex_Template_Header,'Items':Items};         
                      
    // -------------------------
    //  [通常版](旧式)
    // -------------------------
    }else if(version === 0x0000){

      // メニューヘッダ(共に常に0)
      var MenuHeader= {'wVersion':version, 
                       'cbHeaderSize':PE_Byte2Word(this.Stream.Read(2))
                      };
                      
      var menuFlg;    // メニューフラグ        
      var menuID;     // メニューID        
      var level = 0;  // 階層レベル
      var Items = new Array(); // メニューアイテム
      
      while(true){
        if(this.Stream.Pos >= this.Stream.FileSize) throw '[TMenuResDecode]:Reached the end of the file.';
        
        // メニューフラグ
        menuFlg = PE_Byte2Word(this.Stream.Read(2));        
        
        // メニューID
        // ※親メニューにIDはない
        if((menuFlg & MF_POPUP) === MF_POPUP){
          menuID = null;  
        }else{
          menuID = PE_Byte2Word(this.Stream.Read(2));  
        }         
                
        Items[Items.length] = {'menuFlg':menuFlg,'menuID':menuID,'level':level};
        
        // セパレータ  
        if(PE_Byte2Word(this.Stream.Read(2)) === 0){
         
          Items[Items.length-1]['menuText'] = '-';
         
        // メニュー文字列
        }else{
          this.Stream.Pos = this.Stream.Pos - 2;
          Items[Items.length-1]['menuText'] = PE_getStringZero(this.Stream,2);
        }

        // 階層のインクリメント
        if((menuFlg & MF_POPUP) === MF_POPUP){ 
          level++;
        }

        // 階層のデクリメント
        if((menuFlg & MF_END) === MF_END){ 
          if(((menuFlg & MF_POPUP) !== MF_POPUP)){
            level--;
          }
        } 
        
        // 終端
        if((menuFlg & MF_END) === MF_END){ 
           // This decision is not the best.
           if(this.Stream.Pos === this.Stream.FileSize ||     // end of the file
             ((this.Stream.Pos+2) === this.Stream.FileSize)){ // 4 byte boundary
             break;        
           }
        }                
      }
      return {'MenuHeader':MenuHeader,'Items':Items};                               
      
    }else{
      throw '[TMenuResDecode]:Not menu resource.';
    }
  }  
}

// ---------------------------
//  TIconResDecode            
// ---------------------------
// NOTE: When calculated back in BitmapInfoHeader you can get an icon header.
//       You can get the exact icon header in the "Icon Group".

function TIconResDecode() {}

// ---------------------------
//  TIconResDecode.Method     
// ---------------------------
TIconResDecode.prototype = {

  SaveToStream : function (AStream){    
    this.Stream = new TReadStream(AStream);
    var F = new TFileStream(50000);    

    // PNG
    var png_signature = this.Stream.Read(8);
    if(png_signature[0] == 0x89 && png_signature[1] == 0x50 && png_signature[2] == 0x4E && png_signature[3] == 0x47 &&
       png_signature[4] == 0x0D && png_signature[5] == 0x0A && png_signature[6] == 0x1A && png_signature[7] == 0x0A ){
      
      return {'Type':'PNG','Stream':AStream};      
      
    // ICO
    }else{
      this.Stream.Pos = 0;

      // ----------------------
      //  BitmapInfoHeader
      // ----------------------      
      var BIH = new Object;                                                
      BIH.biSize          = PE_Byte2DWord(this.Stream.Read(4));
      BIH.biWidth         = PE_Byte2DWord(this.Stream.Read(4));
      BIH.biHeight        = PE_Byte2DWord(this.Stream.Read(4));
      BIH.biPlanes        = PE_Byte2Word(this.Stream.Read(2));
      BIH.biBitCount      = PE_Byte2Word(this.Stream.Read(2));
      BIH.biCompression   = PE_Byte2DWord(this.Stream.Read(4));
      BIH.biSizeImage     = PE_Byte2DWord(this.Stream.Read(4));
      BIH.biXPelsPerMeter = PE_Byte2DWord(this.Stream.Read(4));
      BIH.biYPelsPerMeter = PE_Byte2DWord(this.Stream.Read(4));
      BIH.biClrUsed       = PE_Byte2DWord(this.Stream.Read(4));
      BIH.biClrImportant  = PE_Byte2DWord(this.Stream.Read(4));
      
      // AND分のサイズを減らす
      BIH.biHeight = BIH.biHeight / 2;
               
      // ----------------------
      //  IconFileHeader
      // ----------------------
      // 予約 常に0
      F.WriteWord(0);
      // リソースタイプ  1:アイコン 2:カーソル
      F.WriteWord(1);
      // アイコンの枚数
      F.WriteWord(1);

      // ----------------------
      //  IconInfoHeader
      // ---------------------- 
        
      // ピクセルデータの計算
      var XorSize = Math.floor((BIH.biBitCount * BIH.biWidth + 31) / 32) * 4 * Math.abs(BIH.biHeight);
      var AndSize = Math.floor((1 * BIH.biWidth + 31) / 32) * 4 * Math.abs(BIH.biHeight) ; 
      var PaletteSize = 0;
      
      // パレット
      if (BIH.biBitCount === 1){
        PaletteSize = 2 *4;
      }else if (BIH.biBitCount === 4){
        PaletteSize = 16 *4;
      }else if (BIH.biBitCount === 8){
        PaletteSize = 256 *4;
      }
           
      // 幅
      if(BIH.biWidth === 256){
        F.WriteByte(0);
      }else{
        F.WriteByte(BIH.biWidth);
      }
      
      // 高さ 
      if(Math.abs(BIH.biHeight) === 256){
        F.WriteByte(0);
      }else{
        F.WriteByte(BIH.biHeight);
      }
      
      // カラー数
      if (BIH.biBitCount === 1){
        F.WriteByte(2);
      }else if (BIH.biBitCount === 4){
        F.WriteByte(16);
      }else{
        F.WriteByte(0);
      }
       
      // 予約値 
      F.WriteByte(0);        
      // アイコンの場合 : 常に1     カーソルの場合 : X ホットスポット
      F.WriteWord(1);        
      // アイコンの場合 : ビット数  カーソルの場合 : Y ホットスポット  
      F.WriteWord(BIH.biBitCount);        
      // ピクセルデータのサイズ(パレット + Xor + And + BitmapInfoHeader)
      F.WriteDWord(PaletteSize + XorSize + AndSize + 40);        
      // ファイルの先頭からBitmapInfoHeaderまでのオフセット
      F.WriteDWord(F.getFileSize()+4);
      
      // ストリームを丸ごとコピー
      F.WriteStream(AStream);
      
      return {'Type':'ICO','Stream':F.Stream.subarray(0, F.getFileSize())};
    }
  }  
}

// ---------------------------
//  TCursorResDecode            
// ---------------------------
// NOTE: Maybe, I think there is PNG format. But, I have never seen...
// NOTE: When calculated back in BitmapInfoHeader you can get an Cursor header.
//       You can get the exact icon header in the "Cursor Group".
function TCursorResDecode() {}

// ---------------------------
//  TCursorResDecode.Method     
// ---------------------------
TCursorResDecode.prototype = {

  SaveToStream : function (AStream){    
    this.Stream = new TReadStream(AStream);
    var F = new TFileStream(50000);    

    var x = PE_Byte2Word(this.Stream.Read(2));
    var y = PE_Byte2Word(this.Stream.Read(2));  
    
    // PNG
    var png_signature = this.Stream.Read(8);
    if(png_signature[0] == 0x89 && png_signature[1] == 0x50 && png_signature[2] == 0x4E && png_signature[3] == 0x47 &&
       png_signature[4] == 0x0D && png_signature[5] == 0x0A && png_signature[6] == 0x1A && png_signature[7] == 0x0A ){
      
      return {'Type':'PNG','Stream':AStream.subarray(4,AStream.length),'X':x,'Y':y};     
      
    // CUR
    }else{
      this.Stream.Pos = this.Stream.Pos - 8;

      // ----------------------
      //  BitmapInfoHeader
      // ----------------------      
      var BIH = new Object;                                                
      BIH.biSize          = PE_Byte2DWord(this.Stream.Read(4));
      BIH.biWidth         = PE_Byte2DWord(this.Stream.Read(4));
      BIH.biHeight        = PE_Byte2DWord(this.Stream.Read(4));
      BIH.biPlanes        = PE_Byte2Word(this.Stream.Read(2));
      BIH.biBitCount      = PE_Byte2Word(this.Stream.Read(2));
      BIH.biCompression   = PE_Byte2DWord(this.Stream.Read(4));
      BIH.biSizeImage     = PE_Byte2DWord(this.Stream.Read(4));
      BIH.biXPelsPerMeter = PE_Byte2DWord(this.Stream.Read(4));
      BIH.biYPelsPerMeter = PE_Byte2DWord(this.Stream.Read(4));
      BIH.biClrUsed       = PE_Byte2DWord(this.Stream.Read(4));
      BIH.biClrImportant  = PE_Byte2DWord(this.Stream.Read(4));
      
      // AND分のサイズを減らす
      BIH.biHeight = BIH.biHeight / 2;
               
      // ----------------------
      //  IconFileHeader
      // ----------------------
      // 予約 常に0
      F.WriteWord(0);
      // リソースタイプ  1:アイコン 2:カーソル
      F.WriteWord(2);
      // アイコンの枚数
      F.WriteWord(1);

      // ----------------------
      //  IconInfoHeader
      // ---------------------- 
        
      // ピクセルデータの計算
      var XorSize = Math.floor((BIH.biBitCount * BIH.biWidth + 31) / 32) * 4 * Math.abs(BIH.biHeight);
      var AndSize = Math.floor((1 * BIH.biWidth + 31) / 32) * 4 * Math.abs(BIH.biHeight) ; 
      var PaletteSize = 0;
      
      // パレット
      if (BIH.biBitCount === 1){
        PaletteSize = 2 *4;
      }else if (BIH.biBitCount === 4){
        PaletteSize = 16 *4;
      }else if (BIH.biBitCount === 8){
        PaletteSize = 256 *4;
      }
           
      // 幅
      if(BIH.biWidth === 256){
        F.WriteByte(0);
      }else{
        F.WriteByte(BIH.biWidth);
      }
      
      // 高さ 
      if(Math.abs(BIH.biHeight) === 256){
        F.WriteByte(0);
      }else{
        F.WriteByte(BIH.biHeight);
      }
      
      // カラー数
      if (BIH.biBitCount === 1){
        F.WriteByte(2);
      }else if (BIH.biBitCount === 4){
        F.WriteByte(16);
      }else{
        F.WriteByte(0);
      }
       
      // 予約値 
      F.WriteByte(0);        
      // アイコンの場合 : 常に1     カーソルの場合 : X ホットスポット
      F.WriteWord(x);        
      // アイコンの場合 : ビット数  カーソルの場合 : Y ホットスポット  
      F.WriteWord(y);        
      // ピクセルデータのサイズ(パレット + Xor + And + BitmapInfoHeader)
      F.WriteDWord(PaletteSize + XorSize + AndSize + 40);        
      // ファイルの先頭からBitmapInfoHeaderまでのオフセット
      F.WriteDWord(F.getFileSize()+4);
      
      // ストリームを丸ごとコピー
      F.WriteStream(AStream.subarray(4,AStream.length));
      
      return {'Type':'CUR','Stream':F.Stream.subarray(0, F.getFileSize())} 
    }
  }  
}

// ---------------------------
//  TBitmapResDecode            
// ---------------------------
function TBitmapResDecode() {}

// ---------------------------
//  TBitmapResDecode.Method     
// ---------------------------
TBitmapResDecode.prototype = {

  SaveToStream : function (AStream){    
    this.Stream = new TReadStream(AStream);
    var F = new TFileStream(50000);    

    // ----------------------
    //  BitmapInfoHeader
    // ----------------------      
    var BIH = new Object;                                                
    BIH.biSize          = PE_Byte2DWord(this.Stream.Read(4));
    BIH.biWidth         = PE_Byte2DWord(this.Stream.Read(4));
    BIH.biHeight        = PE_Byte2DWord(this.Stream.Read(4));
    BIH.biPlanes        = PE_Byte2Word(this.Stream.Read(2));
    BIH.biBitCount      = PE_Byte2Word(this.Stream.Read(2));
    BIH.biCompression   = PE_Byte2DWord(this.Stream.Read(4));
    BIH.biSizeImage     = PE_Byte2DWord(this.Stream.Read(4));
    BIH.biXPelsPerMeter = PE_Byte2DWord(this.Stream.Read(4));
    BIH.biYPelsPerMeter = PE_Byte2DWord(this.Stream.Read(4));
    BIH.biClrUsed       = PE_Byte2DWord(this.Stream.Read(4));
    BIH.biClrImportant  = PE_Byte2DWord(this.Stream.Read(4));
    
    // AND分のサイズを減らす
    BIH.biHeight = BIH.biHeight / 2;
             
    // ピクセルデータの計算
    var XorSize = Math.floor((BIH.biBitCount * BIH.biWidth + 31) / 32) * 4 * Math.abs(BIH.biHeight);
    
    // パレットデータの計算
    var PaletteSize = 0;
    if (!(BIH.biBitCount === 24 ||BIH.biBitCount === 32))  {
      PaletteSize = Math.pow(2,BIH.biBitCount) * 4;
    }
           
    // -------------------------
    //  BitmapFileHeader(14byte)
    // -------------------------
    
    // 0x424D(BM)
    F.WriteByte(0x42);
    F.WriteByte(0x4D);
    
    // ファイルサイズ
    F.WriteDWord(14 + 40 + PaletteSize + XorSize);
    // 予約1
    F.WriteWord(0);
    // 予約2
    F.WriteWord(0);
    // 画像データ(XOR)までのバイト数
    F.WriteDWord(14 + 40 + PaletteSize);
    
    // ストリームを丸ごとコピー
    F.WriteStream(AStream);
    
    return F.Stream.subarray(0, F.getFileSize()); 
  } 
}

////////////////////////////////////////////////////////////////////////////////
// Compiled Resource Encode(*.bin)
////////////////////////////////////////////////////////////////////////////////

// ---------------------------
//  TStringResEncode            
// ---------------------------
function TStringResEncode() {}

// ---------------------------
//  TStringResEncode.Method     
// ---------------------------
TStringResEncode.prototype = {

  SaveToStream : function (resString){    
    var F = new TFileStream(5000);
    
    for(var i=0;i<resString.Value.length;i++){
      if(resString.Value[i] === ''){
        F.WriteWord(0);
      }else{
         // 文字数  
         F.WriteWord(resString.Value[i].length);
        
         // 文字列
         for(var j=0;j<resString.Value[i].length;j++){
           F.WriteWord(resString.Value[i].charCodeAt(j));
         }
      }           
    } 
    return F.Stream.subarray(0, F.getFileSize());
  }
}

// ---------------------------
//  TDialogResEncode            
// ---------------------------
function TDialogResEncode() {}

// ---------------------------
//  TDialogResEncode.Method     
// ---------------------------
TDialogResEncode.prototype = {
  
  setSZorOrdinal : function (F,value){ 
    
    // 文字列
    if(typeof value === "string"){  

      PE_setStringZero(F,value);     

    // 整数 
    }else{
      if(value === 0){
        F.WriteWord(value);
      }else{
        // コントロールID 
        F.WriteWord(0xFFFF);
        F.WriteWord(value);
      }      
    }
  }, 
    
  SaveToStream : function (resDialog){   
    var DS_SETFONT = 64; // DS_SHELLFONTも含まれる      
    var F = new TFileStream(5000);
    
    // -------------------------
    //  [拡張版]
    // -------------------------    
    if(resDialog.DlgTemplateEx){
      
      // DlgTemplateEx
      F.WriteWord(resDialog.DlgTemplateEx.dlgVer);
      F.WriteWord(resDialog.DlgTemplateEx.signature);      
      F.WriteDWord(resDialog.DlgTemplateEx.helpID);      
      F.WriteDWord(resDialog.DlgTemplateEx.exStyle);      
      F.WriteDWord(resDialog.DlgTemplateEx.style);      
      F.WriteWord(resDialog.DlgTemplateEx.cDlgItems);      
      F.WriteWord(resDialog.DlgTemplateEx.x);      
      F.WriteWord(resDialog.DlgTemplateEx.y);      
      F.WriteWord(resDialog.DlgTemplateEx.cx);      
      F.WriteWord(resDialog.DlgTemplateEx.cy);          
      this.setSZorOrdinal(F,resDialog.DlgTemplateEx.menu); 
      this.setSZorOrdinal(F,resDialog.DlgTemplateEx.windowClass); 
      PE_setStringZero(F,resDialog.DlgTemplateEx.title);
          
      // ウインドウにフォントが含まれる場合
      if((resDialog.DlgTemplateEx.style & DS_SETFONT) === DS_SETFONT){
        F.WriteWord(resDialog.DlgTemplateEx.pointsize);
        F.WriteWord(resDialog.DlgTemplateEx.weight);        
        F.WriteByte(resDialog.DlgTemplateEx.italic);
        F.WriteByte(resDialog.DlgTemplateEx.charset);      
        PE_setStringZero(F,resDialog.DlgTemplateEx.typeface); 
      }
      
      // DlgItemTemplateEx 
      for(var i=0;i<resDialog.DlgTemplateEx.cDlgItems;i++){
        
        // 4byte境界のパディング
        PE_PaddingDword(F);

        F.WriteDWord(resDialog.DlgItemTemplateEx[i].helpID);
        F.WriteDWord(resDialog.DlgItemTemplateEx[i].exStyle);      
        F.WriteDWord(resDialog.DlgItemTemplateEx[i].style);
        F.WriteWord(resDialog.DlgItemTemplateEx[i].x);
        F.WriteWord(resDialog.DlgItemTemplateEx[i].y);      
        F.WriteWord(resDialog.DlgItemTemplateEx[i].cx);
        F.WriteWord(resDialog.DlgItemTemplateEx[i].cy);
        F.WriteDWord(resDialog.DlgItemTemplateEx[i].id);     
        this.setSZorOrdinal(F,resDialog.DlgItemTemplateEx[i].windowClass); 
        this.setSZorOrdinal(F,resDialog.DlgItemTemplateEx[i].title);          
        F.WriteWord(resDialog.DlgItemTemplateEx[i].extraCount); 
        
        for(var j=0;j<resDialog.DlgItemTemplateEx[i].lParamData.length;j++){  
          F.WriteByte(resDialog.DlgItemTemplateEx[i].lParamData[j]); 
        }                                           
      }
          
    // -------------------------
    //  [通常版]
    // -------------------------                            
    }else{
      
      // DlgTemplate
      F.WriteDWord(resDialog.DlgTemplate.style);
      F.WriteDWord(resDialog.DlgTemplate.dwExtendedStyle);      
      F.WriteWord(resDialog.DlgTemplate.cdit);      
      F.WriteWord(resDialog.DlgTemplate.x);      
      F.WriteWord(resDialog.DlgTemplate.y);      
      F.WriteWord(resDialog.DlgTemplate.cx);      
      F.WriteWord(resDialog.DlgTemplate.cy);          
      this.setSZorOrdinal(F,resDialog.DlgTemplate.menu); 
      this.setSZorOrdinal(F,resDialog.DlgTemplate.windowClass); 
      PE_setStringZero(F,resDialog.DlgTemplate.title);

      // ウインドウにフォントが含まれる場合
      if((resDialog.DlgTemplate.style & DS_SETFONT) === DS_SETFONT){
        F.WriteWord(resDialog.DlgTemplate.pointsize);
        PE_setStringZero(F,resDialog.DlgTemplate.typeface); 
      }
      
      // DlgItemTemplate 
      for(var i=0;i<resDialog.DlgTemplate.cdit;i++){
        
        // 4byte境界のパディング
        PE_PaddingDword(F);

        F.WriteDWord(resDialog.DlgItemTemplate[i].style);
        F.WriteDWord(resDialog.DlgItemTemplate[i].dwExtendedStyle);      
        F.WriteWord(resDialog.DlgItemTemplate[i].x);
        F.WriteWord(resDialog.DlgItemTemplate[i].y);      
        F.WriteWord(resDialog.DlgItemTemplate[i].cx);
        F.WriteWord(resDialog.DlgItemTemplate[i].cy);
        F.WriteWord(resDialog.DlgItemTemplate[i].id);     
        this.setSZorOrdinal(F,resDialog.DlgItemTemplate[i].windowClass); 
        this.setSZorOrdinal(F,resDialog.DlgItemTemplate[i].title);          
        F.WriteWord(resDialog.DlgItemTemplate[i].extraCount); 
        
        for(var j=0;j<resDialog.DlgItemTemplate[i].lParamData.length;j++){  
          F.WriteByte(resDialog.DlgItemTemplate[i].lParamData[j]); 
        }       
      }      
    }
    return F.Stream.subarray(0, F.getFileSize());
  }
}

// ---------------------------
//  TMenuResEncode            
// ---------------------------
function TMenuResEncode() {}

// ---------------------------
//  TMenuResEncode.Method     
// ---------------------------
TMenuResEncode.prototype = {

  SaveToStream : function (resMenu){   
    var F = new TFileStream(5000);    
    
    // -------------------------
    //  [拡張版]
    // -------------------------    
    if(resMenu.Menuex_Template_Header){
      
      // Menuex_Template_Header
      F.WriteWord(resMenu.Menuex_Template_Header.wVersion);
      F.WriteWord(resMenu.Menuex_Template_Header.wOffset);
      F.WriteDWord(resMenu.Menuex_Template_Header.dwHelpId);
                  
      // Menuex_Template_Item 
      for(var i=0;i<resMenu.Items.length;i++){
        F.WriteDWord(resMenu.Items[i].dwType);
        F.WriteDWord(resMenu.Items[i].dwState);
        F.WriteDWord(resMenu.Items[i].menuID);
        F.WriteWord(resMenu.Items[i].menuFlg);
        
        // セパレータ
        var menuText = resMenu.Items[i].menuText;
        if(menuText === '-'){
          menuText = '';
        }
        PE_setStringZero(F,menuText); 
        
        // 4byte境界のパディング
        PE_PaddingDword(F);        
           
        //ドロップダウンメニューまたはサブメニューのヘルプID
        if((resMenu.Items[i].menuFlg & 0x01) === 0x01){  
          F.WriteDWord(resMenu.Items[i].dwHelpId);
        }                                        
      }
           
    // -------------------------
    //  [通常版]
    // -------------------------    
    }else{
      var MF_POPUP   = 0x10; // ポップアップ
    
      // MenuHeader
      F.WriteWord(resMenu.MenuHeader.wVersion);
      F.WriteWord(resMenu.MenuHeader.cbHeaderSize);
                  
      // NormalMenuItem or PopupMenuItem   
      for(var i=0;i<resMenu.Items.length;i++){
        F.WriteWord(resMenu.Items[i].menuFlg);
        
        // メニューID ※親メニューにIDはない
        if((resMenu.Items[i].menuFlg & MF_POPUP) !== MF_POPUP){
          F.WriteWord(resMenu.Items[i].menuID);          
        }
        
        // セパレータ
        if(resMenu.Items[i].menuText === '-'){
          F.WriteWord(0);
           
        // メニュー文字列  
        }else{
          PE_setStringZero(F,resMenu.Items[i].menuText); 
        }                                    
      }

      // Padding
      // CAUTION : ファイルによってはラストにパディングがない場合があります。
      //         : Perhaps,Compiler bug? 
      PE_PaddingDword(F);              
    }    
    return F.Stream.subarray(0, F.getFileSize());    
  }
}

////////////////////////////////////////////////////////////////////////////////
// Core Class
////////////////////////////////////////////////////////////////////////////////

// ---------------------
//  TPEAnalyst            
// ---------------------
function TPEAnalyst() {} 

// ---------------------
//  TPEAnalyst.Method     
// ---------------------
TPEAnalyst.prototype = {
  
  // RVAの取得
  getTableRVA : function(DataDirectoryIndex,SectionIndex){     
    // 大きい方の値を実アドレスにする
    if(this.IMAGE_OPTIONAL_HEADER.DataDirectory[DataDirectoryIndex].RVA >=
       this.IMAGE_SECTION_HEADER[SectionIndex].VirtualAddress){
      return this.IMAGE_OPTIONAL_HEADER.DataDirectory[DataDirectoryIndex].RVA
    }else{
      return this.IMAGE_SECTION_HEADER[SectionIndex].VirtualAddress;
    }  
  },
  
  // RVAを手掛かりにセクション情報を取得する
  getSectionInfo : function(RVA){
    var offset;
    
    for(var i=0;i<this.IMAGE_COFF_HEADER.NumberOfSections;i++){
      offset = RVA - this.IMAGE_SECTION_HEADER[i].VirtualAddress;
      // 仮想アドレスの挟み打ち
      if(offset >= 0 &&  offset< this.IMAGE_SECTION_HEADER[i].SizeOfRawData){
        return {
                'Pos'   : this.IMAGE_SECTION_HEADER[i].PointerToRawData + offset,  // セクションの位置
                'Size'  : this.IMAGE_SECTION_HEADER[i].SizeOfRawData - offset,     // セクションのサイズ (DataDirectory[?].sizeとは異なる) 
                'Index' : i,                                 // セクション番号  
                'Name'  : this.IMAGE_SECTION_HEADER[i].Name  // セクション名               
               };
      }
    }
    return {'Pos':0,'Size':0,'index':-1,'Name':''};
  },    
    
  // [Non-recommendation]コードセクションを取得する(.text/CODEなど名称多数)
  // NOTE : Can not determine in the section flag (Characteristics).
  _getCodeSection : function(){
    var result = new Array();
    
    // Resource Only
    if(this.IMAGE_OPTIONAL_HEADER.SizeOfCode === 0){
      this._CODE_SECTION = result;
      return;
    }
    
    // コードセクションの検索
    var Size,total = 0;
    for(var i=0;i<this.IMAGE_SECTION_HEADER.length;i++){       
      
      // コードセクションの先頭アドレスが一致
      if(this.IMAGE_OPTIONAL_HEADER.BaseOfCode === this.IMAGE_SECTION_HEADER[i].VirtualAddress){
        
        // セクションの実サイズを取得
        if(this.IMAGE_SECTION_HEADER[i].VirtualSize > this.IMAGE_SECTION_HEADER[i].SizeOfRawData){
         
          // 初期化されていないデータのみ含まれる
          if(this.IMAGE_SECTION_HEADER[i].SizeOfRawData === 0){
            Size = 0;
          }else{
            Size = this.IMAGE_SECTION_HEADER[i].VirtualSize;
          }
        }else{
          Size = this.IMAGE_SECTION_HEADER[i].SizeOfRawData;
        }
                
        // 1つ目のコードセクション
        result[result.length] = this.IMAGE_SECTION_HEADER[i];          
        total += Size;
        
        // セクションサイズがコードセクション以上ならば終了
        if(this.IMAGE_OPTIONAL_HEADER.SizeOfCode <= total){
          this._CODE_SECTION = result;
          return;
        }else{
          // 2つ目以降のコードセクション
          var j=(i+1);
          while (true){
            if(this.IMAGE_SECTION_HEADER.length <= j) throw '[_getCodeSection]:Could not read properly.';
            
            if(this.IMAGE_SECTION_HEADER[j].VirtualSize > this.IMAGE_SECTION_HEADER[j].SizeOfRawData){
              if(this.IMAGE_SECTION_HEADER[j].SizeOfRawData === 0){
                Size = 0;
              }else{
                Size = this.IMAGE_SECTION_HEADER[j].VirtualSize;
              }
            }else{
              Size = this.IMAGE_SECTION_HEADER[j].SizeOfRawData;
            }
        
            result[result.length] = this.IMAGE_SECTION_HEADER[j];          
            total += Size;
            if(this.IMAGE_OPTIONAL_HEADER.SizeOfCode <= total){
              this._CODE_SECTION = result;
              return;
            }
            j++;
          }
        }
      }
    }                    
    this._CODE_SECTION = result;
  },
  
  // [Non-recommendation]データセクションを取得する(.data/DATAなど名称多数)
  // NOTE : コードセクションを除く全てのセクションがデータセクションとなるので
  //      : グローバル変数などが定義されているものと思われるセクションを取得します。
  _getDataSection : function(){

    // セクションを列挙
    var result = new Array();
    for(var i=0;i<this.IMAGE_SECTION_HEADER.length;i++){ 
      result[result.length] = this.IMAGE_SECTION_HEADER[i];
    }

    // コードセクションを除く
    for(var i=0;i<this._CODE_SECTION.length;i++){ 
      for(var j=0;j<result.length;j++){
        if(result[j].Name === this._CODE_SECTION[i].Name){          
          result.splice(j,1);
        }
      }
    }
    
    // データディレクトリに登録されているセクションを除く
    var Section;
    for(var i=0;i<this.IMAGE_OPTIONAL_HEADER.DataDirectory.length;i++){ 
      
      // デバッグ情報はスキップ
      if(i === 6){ 
        continue;
      }
      // セクションの取得 
      Section =  this.getSectionInfo(this.IMAGE_OPTIONAL_HEADER.DataDirectory[i].RVA);
      for(var j=0;j<result.length;j++){
        if (result[j].Name === Section.Name){
          result.splice(j,1);
        }
      }
    }
    this._DATA_SECTION = result; 
  },    
      
  // API関数のエキスポート情報の取得
  getExportInfo : function(){ 
    this.Export = {'Names':new Array()};

    // RVAが存在する    
    if (this.IMAGE_OPTIONAL_HEADER.DataDirectory[0].RVA !== 0){
     
      // セクションの取得 
      var Section =  this.getSectionInfo(this.IMAGE_OPTIONAL_HEADER.DataDirectory[0].RVA);

      // セクションが存在する
      if(Section.Index !== -1){
        this.Stream.Pos = Section.Pos;
        var stream = this.Stream.Read(Section.Size);
        var ReadStream = new TReadStream(stream);
              
        // -------------------------
        //  ExportDirectoryTable(40byte)
        // -------------------------         
        var ExportDirectoryTable = {
          'ExportFlags'           : PE_Byte2DWord(ReadStream.Read(4)),  // 将来への予約(0)
          'TimeDateStamp'         : PE_Byte2DWord(ReadStream.Read(4)),  // エクスポートデータの作成日時      
          'MajorVersion'          : PE_Byte2Word(ReadStream.Read(2)),   // メジャーバージョン番号
          'MinorVersion'          : PE_Byte2Word(ReadStream.Read(2)),   // マイナーバージョン番号      
          'NameRVA'               : PE_Byte2DWord(ReadStream.Read(4)),  // DLL名称へのアドレス(イメージベース相対)
          'OrdinalBase'           : PE_Byte2DWord(ReadStream.Read(4)),  // エクスポートの最初の序数(1が多い)      
          'AddressTableEntries'   : PE_Byte2DWord(ReadStream.Read(4)),  // エクスポートアドレステーブルのエントリ数
          'NumberofNamePointers'  : PE_Byte2DWord(ReadStream.Read(4)),  // 名前ポインタテーブル内のエントリ数      
          'ExportAddressTableRVA' : PE_Byte2DWord(ReadStream.Read(4)),  // エクスポートアドレステーブルのアドレス(イメージベース相対)
          'NamePointerRVA'        : PE_Byte2DWord(ReadStream.Read(4)),  // エクスポート名ポインタテーブルのアドレス(イメージベース相対)
          'OrdinalTableRVA'       : PE_Byte2DWord(ReadStream.Read(4))   // 序数テーブルのアドレス(イメージベース相対)                                  
        };

        // エントリ数がある場合
        if(ExportDirectoryTable.AddressTableEntries !== 0){     
          
          // エキスポートRVA
          var ExportRVA = this.getTableRVA(0,Section.Index);

          // アドレステーブル(4byte xN) ※エントリポイント
          var EntryPoint = new Array();
          ReadStream.Pos =  ExportDirectoryTable.ExportAddressTableRVA - ExportRVA;          
          for(var i=0; i<ExportDirectoryTable.AddressTableEntries;i++){
            EntryPoint[i] = PE_Byte2DWord(ReadStream.Read(4));
          }       

          // 名前ポインタテーブル(4byte x N)
          var NamePointer = new Array();
          ReadStream.Pos =  ExportDirectoryTable.NamePointerRVA - ExportRVA;           
          for(var i=0; i<ExportDirectoryTable.NumberofNamePointers;i++){
            NamePointer[i] = PE_Byte2DWord(ReadStream.Read(4));
          }                        
                                   
          // エクスポート序数テーブル(2byte x N)
          var Ordinal = new Array();
          ReadStream.Pos =  ExportDirectoryTable.OrdinalTableRVA - ExportRVA; 
          for(var i=0; i<ExportDirectoryTable.NumberofNamePointers;i++){
            Ordinal[i] = PE_Byte2Word(ReadStream.Read(2)) + ExportDirectoryTable.OrdinalBase;
          }

          // DLLの名称    
          ReadStream.Pos =  ExportDirectoryTable.NameRVA - ExportRVA;                
          var P='',C;
          while(true){
            
            if(ReadStream.Pos >= ReadStream.FileSize){ 
              throw 'Export:Reached the end of the file.';
            }
                         
            C = PE_Byte2StringN(ReadStream.Read(1));
            if(C === '\0') break;
            P = P + C;
          }
         
          // DLL名
          this.Export.Names[0] = P;  
          this.Export[this.Export.Names[0]] = {'Ordinal'    : new Array(),
                                               'Hint'       : new Array(),
                                               'Function'   : new Array(),
                                               'EntryPoint' : EntryPoint,
                                               'EntryName'  : new Array()};         
                                               
          // 関数の名称
          var Function = new Array();
          for(var i=0; i<NamePointer.length;i++){
            ReadStream.Pos = NamePointer[i] - ExportRVA;

            // NULLが出現するまで文字列を取得
            var P='',C;
            while(true){

              if(ReadStream.Pos >= ReadStream.FileSize){ 
                throw 'Export:Reached the end of the file.';
              }
                           
              C = PE_Byte2StringN(ReadStream.Read(1));
              if(C === '\0') break;
              P = P + C;
            }                      
            Function[i] = P;
          }    
          
          // ----------------------------------------------------------------------------------
          //  ソートの概要
          //
          //  NOTE : ソートはOrdinal,Function,Hintを対象としてOrdinalをキーに昇順にします。   
          //         EntryPointはソートをしないでそのままの順番で使用します。
          //         
          //         Ordinalの順序に空きがある場合は関数名称がない「序数のみの関数」となります。 
          //         EntryPointが0の場合は恐らく将来用の予約で、その関数は使用できません。 
          // 
          //         ※恐らくこの仕様で間違いないと思います :-)
          // ----------------------------------------------------------------------------------
             
          // ソートの事前準備
          var Hint = new Array();
          for(var i=0;i<ExportDirectoryTable.AddressTableEntries;i++){
            this.Export[this.Export.Names[0]].EntryName[i] = '';
            Hint[i] = i;
            
            if(i >= ExportDirectoryTable.NumberofNamePointers){
              Ordinal[i] = -1;
            }
          }
          
          // ソート
          var count = 0,NameFlg;
          var Base = ExportDirectoryTable.OrdinalBase;
          while (true){
            
            // 関数名称あり
            NameFlg = false; 
            if(Ordinal[i] !== -1){
              for(var i=0; i<Ordinal.length;i++){
                if(Ordinal[i] === Base){
                  this.Export[this.Export.Names[0]].Ordinal[count]  = Ordinal[i];
                  this.Export[this.Export.Names[0]].Hint[count]     = Hint[i];
                  this.Export[this.Export.Names[0]].Function[count] = Function[i];
                  Base++; NameFlg = true;
                  break;
                }
              }
            }
            
            // 関数名称なし(EntryNameの取得)
            if(!NameFlg){          
              var Pos = EntryPoint[count] - ExportRVA;
              
              if(Pos > 0){
                ReadStream.Pos =  Pos;   
                
                var P='',C;
                while(true){
                  
                  if(ReadStream.Pos >= ReadStream.FileSize){ 
                    throw 'Export:Reached the end of the file.';
                  }
                               
                  C = PE_Byte2StringN(ReadStream.Read(1));
                  if(C === '\0') break;
                  P = P + C;
                }             
                this.Export[this.Export.Names[0]].EntryName[count] = P;
              }                  
 
              this.Export[this.Export.Names[0]].Hint[count]     = 'N/A';
              this.Export[this.Export.Names[0]].Function[count] = 'N/A';
              this.Export[this.Export.Names[0]].Ordinal[count]  = Base;
              Base++;                              
            }
            
            count++;            
            if(count === EntryPoint.length){
              break;
            }
          }
         
          // For debugging
          // document.write('<table>');
          // for(var i=0;i<this.Export[this.Export.Names[0]].Ordinal.length;i++){
          //   document.write('<tr>');
          //     document.write('<td>'   + this.Export[this.Export.Names[0]].Ordinal[i] + '</td>');
          //     document.write('<td>'   + this.Export[this.Export.Names[0]].Hint[i] + '</td>');                 
          //     document.write('<td>'   + this.Export[this.Export.Names[0]].Function[i] + '</td>'); 
          //     document.write('<td>'   + PE_IntToHex(this.Export[this.Export.Names[0]].EntryPoint[i],8) + '</td>');
          //     document.write('<td>'   + this.Export[this.Export.Names[0]].EntryName[i] + '</td>'); 
          //  document.write('<tr>');
          // }
          // document.write('</table>');     
        }      
      }
    }
  },
    
  // API関数のインポート情報の取得
  getImportInfo : function (){
    this.Import = {'Names':new Array()};
    
    // RVAが存在する
    if (this.IMAGE_OPTIONAL_HEADER.DataDirectory[1].RVA !== 0){
     
      // セクションの取得 
      var Section =  this.getSectionInfo(this.IMAGE_OPTIONAL_HEADER.DataDirectory[1].RVA);
      
      // セクションが存在する     
      if(Section.Index !== -1){
        
        this.Stream.Pos = Section.Pos;
        var stream = this.Stream.Read(Section.Size);       
        var ReadStream = new TReadStream(stream);                                 
            
        // インポートRVA
        var ImportRVA = this.getTableRVA(1,Section.Index);         
   
        // -------------------------
        //  ImportDirectoryTable(20byte)
        // -------------------------   
        var count =0;               
        var ImportDirectoryTable = new Array();
        while(true){
          
          if(ReadStream.Pos >= ReadStream.FileSize){
            throw 'Import:Reached the end of the file.';           
          }
  
          ImportDirectoryTable[count] = {
            'ImportLookupTableRVA'  : PE_Byte2DWord(ReadStream.Read(4)), // インポートルックアップテーブルのアドレス(イメージベース相対)
            'TimeDateStamp'         : PE_Byte2DWord(ReadStream.Read(4)), // 結合前は0で結合後はタイムスタンプ     
            'FowarderChain'         : PE_Byte2DWord(ReadStream.Read(4)), // フォワーダチェーン
            'NameRVA'               : PE_Byte2DWord(ReadStream.Read(4)), // DLL名称へのアドレス(イメージベース相対)  
            'ImportAddressTableRVA' : PE_Byte2DWord(ReadStream.Read(4))  // インポートアドレステーブルのアドレス(イメージベース相対)   
          };
          
          // 最後には必ず空の構造体が格納される
          if (ImportDirectoryTable[count].TimeDateStamp === 0 && ImportDirectoryTable[count].NameRVA === 0){
            break;
          }
          
          count++;          
        }            
           
        // -------------------------
        //  ファイル名の取得
        // -------------------------        
        // ラストの構造体は空なので-1にする
        for(var i=0;i<ImportDirectoryTable.length-1;i++){
          
          ReadStream.Pos = ImportDirectoryTable[i].NameRVA - ImportRVA;
          
          // NULLが出現するまで文字列を取得
          var P='',C;
          while(true){

            if(ReadStream.Pos >= ReadStream.FileSize){ 
              throw 'Import:Reached the end of the file.';
            }
                         
            C = PE_Byte2StringN(ReadStream.Read(1));
            if(C === '\0') break;
            P = P + C;
          }
          this.Import.Names[this.Import.Names.length] = P;
          this.Import[P] = new Array();          
        }
        
        // -------------------------
        //  関数名の取得
        // -------------------------         
        // ラストの構造体は空なので-1にする
        for(var i=0;i<ImportDirectoryTable.length-1;i++){
          
          // LookUpTableの位置へ移動
          if (ImportDirectoryTable[i].ImportLookupTableRVA !== 0){
            ReadStream.Pos = ImportDirectoryTable[i].ImportLookupTableRVA - ImportRVA;
          }else{
            ReadStream.Pos = ImportDirectoryTable[i].ImportAddressTableRVA - ImportRVA;
          }          

          // LookUpTable(4byte x N)    
          var count =0;               
          var LookUpTable = new Array();
          while(true){
            
            if(ReadStream.Pos >= ReadStream.FileSize){
               throw 'Import:Reached the end of the file.';         
            }
            
            // 64bit
            if (this.IMAGE_OPTIONAL_HEADER.Magic === 0x20B){
              
               LookUpTable[count] = PE_Byte2QWord(ReadStream.Read(8)); 
               
            // 32bit/ROMイメージ   
            }else{
              LookUpTable[count] = PE_Byte2DWord(ReadStream.Read(4)); 
            }
           
            if(LookUpTable[count] === 0) break;
            count++;
          } 
          
          var j=0;
          while(true){
            // ラストのLookUpTableは0なので-1にする
            if(j >= LookUpTable.length-1) break;
            
            // 序数
            if ((LookUpTable[j] & 0x80000000) !== 0){

              var dll = this.Import.Names[i];                             
              this.Import[dll][this.Import[dll].length] = (LookUpTable[j] - 0x80000000) + '(Ordinal number)';

            // 関数
            }else{
               // 次のLookUpTableが序数フラグならば序数
               // NOTE : 恐らく、64bitでこの仕様が追加されたと思います。
               if(LookUpTable[j+1] === 0x80000000){
                 var dll = this.Import.Names[i];                             
                 this.Import[dll][this.Import[dll].length] = LookUpTable[j] + '(Ordinal number)';
                 j = j +2;
                 continue;
               }
               
               var Adress = LookUpTable[j] - ImportRVA;
               
               // NULL(0)の2個分をスキップ
               ReadStream.Pos = Adress+2;

               // NULLが出現するまで文字列を取得
               var P='',C;
               while(true){

                 if(ReadStream.Pos >= ReadStream.FileSize){
                   throw 'Import:Reached the end of the file.';  
                 }
                              
                 C = PE_Byte2StringN(ReadStream.Read(1));
                 if(C === '\0') break;
                 P = P + C;
               }
               var dll = this.Import.Names[i];
               this.Import[dll][this.Import[dll].length] = P;
            }  
            j++;          
          }          
        } 
        
        // 各項目を昇順ソート
        this.Import.Names.sort();
        for(var i=0;i<this.Import.Names.length;i++){
          this.Import[this.Import.Names[i]].sort();
        }        
      }        
    }
  },  
  
  // リソースの取得
  getResourceInfo : function (){
    
    // リソースの種類を取得する
    function getResourceType(value){
      switch(value){
        case   1: return 'Cursor';
        case   2: return 'Bitmap';
        case   3: return 'Icon';
        case   4: return 'Menu';
        case   5: return 'Dialog';
        case   6: return 'String Table';
        case   7: return 'Font Directory';
        case   8: return 'Font';
        case   9: return 'Accelerator';
        case  10: return 'RCData';
        case  11: return 'Message Table';
        case  12: return 'Cursor Group';
        case  14: return 'Icon Group';
        case  16: return 'Version Info';
        case  17: return 'Dialog Include';
        case  19: return 'Plug and Play';
        case  20: return 'VXD';
        case  21: return 'Animation Cursor';
        case  22: return 'Animation Icon';
        case  23: return 'HTML';
        case  24: return 'Manifest';
        case  28: return 'Ribbon';
        case 241: return 'ToolBar';                
      }
      // IUnknown
      return value;      
    }
    
    // リソースを再帰的に取得する(最大3レベル迄)
    function getRecursionResource(ReadStream,self,level,parent,resNameID){
      
      // -------------------------        
      //  ResourceDirectoryTables
      //  (16byte)
      // -------------------------
      var ResourceDirectoryTables = {
        'Characteristics'     : PE_Byte2DWord(ReadStream.Read(4)), // リソースフラグ。将来への予約(0)
        'TimeDateStamp'       : PE_Byte2DWord(ReadStream.Read(4)), // 作成日時     
        'MajorVersion'        : PE_Byte2Word(ReadStream.Read(2)),  // メジャーバージョン番号
        'MinorVersion'        : PE_Byte2Word(ReadStream.Read(2)),  // マイナーバージョン番号  
        'NumberofNameEntries' : PE_Byte2Word(ReadStream.Read(2)),  // ディレクトリ(リソース)エントリの数  文字列バージョン 
        'NumberofIDEntries'   : PE_Byte2Word(ReadStream.Read(2))   // ディレクトリ(リソース)エントリの数  IDバージョン 
      };
      
      // -------------------------  
      //  ResourceDirectoryEntries
      //  (4byte x 2 x N) 
      // -------------------------          
      var ResourceDirectoryEntries = new Array();
      
      // *** リソース名称が「リソース名」
      for(var i=0;i<ResourceDirectoryTables.NumberofNameEntries;i++){          
        var IntegerID = PE_Byte2DWord(ReadStream.Read(4));
        var Offset = PE_Byte2DWord(ReadStream.Read(4));
        
        // 最初はそのまま設定する
        ResourceDirectoryEntries[i] = {
          'IntegerID'       : IntegerID,
          'DataEntryOffset' : Offset,
          'ResourceName'    : '',
          'ResourceNameFlg' : true,  
          'DirectoryFlg'    : false,
          'SubDirectoryOffsetFlg' : false                      
        };   
      }

      // *** リソース名称が「リソースID」
      for(var i=0;i<ResourceDirectoryTables.NumberofIDEntries;i++){          
        var IntegerID = PE_Byte2DWord(ReadStream.Read(4));
        var Offset = PE_Byte2DWord(ReadStream.Read(4));
        
        // 最初はそのまま設定する
        ResourceDirectoryEntries[ResourceDirectoryEntries.length] = {
          'IntegerID'       : IntegerID,
          'DataEntryOffset' : Offset,
          'ResourceName'    : '',
          'ResourceNameFlg' : false ,
          'DirectoryFlg'    : false, 
          'SubDirectoryOffsetFlg' : false                            
        };   
      }
      
      // リソースID/リソース名の設定
      for(var i=0;i<ResourceDirectoryEntries.length;i++){  
                  
        // ディレクトリ 
        // ※ディレクトリ名は「ResourceName」に格納される
        if(((ResourceDirectoryEntries[i].IntegerID & 0x80000000) >>> 0) === 0x80000000){
          ResourceDirectoryEntries[i]['DirectoryFlg'] = true;
          ResourceDirectoryEntries[i]['ResourceNameFlg'] = true;
        }
        
        // IntegerIDは31bitのみ使用する(仕様書には未記載)
        ResourceDirectoryEntries[i].IntegerID = ((ResourceDirectoryEntries[i].IntegerID & 0x7FFFFFFF) >>> 0);
        
        // サブディレクトリオフセット or データエントリオフセット
        if(((ResourceDirectoryEntries[i].DataEntryOffset & 0x80000000) >>> 0) === 0x80000000){
          // ※先頭1bitがオンは「Subdirectory Offset」でオフは「Data Entry Offset」となる
          ResourceDirectoryEntries[i]['SubDirectoryOffsetFlg'] = true;
        }
        // DataEntryOffsetは31bitのみを使用する
        ResourceDirectoryEntries[i].DataEntryOffset = ((ResourceDirectoryEntries[i].DataEntryOffset & 0x7FFFFFFF) >>> 0);
        
        // リソース名称の取得(ディレクトリ名含む)
        if(ResourceDirectoryEntries[i].ResourceNameFlg){      

          // リソース名の長さ(文字数 x 2)            
          ReadStream.Pos = ResourceDirectoryEntries[i].IntegerID;
          var length = PE_Byte2Word(ReadStream.Read(2));
      
          var P= '';
          for(var j=0;j<length;j++){ 
            P += String.fromCharCode(PE_Byte2Word(ReadStream.Read(2)));
          }            
          ResourceDirectoryEntries[i].ResourceName = P;            
        }
        
        // [最初の階層のみ]プロパティに「リソースの種類」を追加する
        if(level == 1){
          // リソース(Original)
          if(ResourceDirectoryEntries[i].ResourceNameFlg){
            ResourceDirectoryEntries[i]['ResourceTypeName'] = ResourceDirectoryEntries[i].ResourceName;
          // リソース(Win definition)   
          }else{
            ResourceDirectoryEntries[i]['ResourceTypeName'] = getResourceType(ResourceDirectoryEntries[i].IntegerID);
          }
        }              
      }     
      
      // [Type][親]リソースの種類
      if (level === 1){ 
        self.Resource = {'Type':undefined};          
        self.Resource.Type = {'ResourceDirectoryTables': ResourceDirectoryTables};
        self.Resource.Type['ResourceDirectoryEntries']  =  ResourceDirectoryEntries; 
        
        self.Resource['Name'] = new Array();
        self.Resource['Language'] = new Array();          
        for(var i=0;i<ResourceDirectoryEntries.length;i++){
          ReadStream.Pos = ResourceDirectoryEntries[i].DataEntryOffset;

          // 再帰処理
          getRecursionResource(ReadStream,self,2,i);
        }
      
      // [Name][子]親のリソースの個数とID/名称      
      }else if (level === 2){ 
        self.Resource.Name[self.Resource.Name.length] =  {
          'ResourceDirectoryTables'  : ResourceDirectoryTables,
          'ResourceDirectoryEntries' : ResourceDirectoryEntries
        };

        for(var i=0;i<ResourceDirectoryEntries.length;i++){
           ReadStream.Pos = ResourceDirectoryEntries[i].DataEntryOffset;
           
           // 再帰処理
           if(ResourceDirectoryEntries[i].ResourceNameFlg){
             // リソース名
             getRecursionResource(ReadStream,self,3,parent,ResourceDirectoryEntries[i].ResourceName);
           }else{
             // リソースID
             getRecursionResource(ReadStream,self,3,parent,ResourceDirectoryEntries[i].IntegerID);
           }
        }
      
      // [Name][孫]子のリソースのデータへのアドレス   
      }else if (level === 3){ 
        self.Resource.Language[self.Resource.Language.length] =  { 
          'resNameID'                : resNameID,        
          'parent'                   : parent,            
          'ResourceDirectoryTables'  : ResourceDirectoryTables,
          'ResourceDirectoryEntries' : ResourceDirectoryEntries,
          'ResourceDataEntry'        : new Array()
        };
        
        for(var i=0;i<ResourceDirectoryEntries.length;i++){
          ReadStream.Pos = ResourceDirectoryEntries[i].DataEntryOffset;
           
          // ResourceDataEntry
          var ResourceDataEntry = {
            'DataRVA'  : PE_Byte2DWord(ReadStream.Read(4)), // リソース データ領域のリソース データの単位のアドレス
            'Size'     : PE_Byte2DWord(ReadStream.Read(4)), // Data RVAフィールドによって指し示されているリソースデータのサイズ     
            'Codepage' : PE_Byte2DWord(ReadStream.Read(4)), // リソース データ内部のコードポイント値をデコードするために使われるコードページ
            'Reserved' : PE_Byte2DWord(ReadStream.Read(4))  // 予約値(0)  
          };            
          
          var RDE = self.Resource.Language[self.Resource.Language.length-1].ResourceDataEntry;
          RDE[RDE.length] = ResourceDataEntry;
        }          
      }        
    }
    
    // RVAが存在する
    if (this.IMAGE_OPTIONAL_HEADER.DataDirectory[2].RVA !== 0){
     
      // セクションの検索 
      var Section =  this.getSectionInfo(this.IMAGE_OPTIONAL_HEADER.DataDirectory[2].RVA);
      
      // セクションが存在する     
      if(Section.Index !== -1){        
        this.Stream.Pos = Section.Pos;
        var stream = this.Stream.Read(Section.Size);       
        var ReadStream = new TReadStream(stream); 
        
        // リソースを再帰処理で取得する
        getRecursionResource(ReadStream,this,1);
      }
    }    
  },
    
  // ファイルの読み込み   
  LoadFromStream : function (AStream,PackedFlg){        
    this.Stream = new TReadStream(AStream);
    
    // -------------------------
    //  DOSスタブ(64byte)
    // -------------------------
    this.IMAGE_DOS_HEADER = {
      'e_magic'    : PE_Byte2String(this.Stream.Read(2)),  // シグネチャ 'MZ'
      'e_cblp'     : PE_Byte2Word(this.Stream.Read(2)),    // 最終ページのバイト数
      'e_cp'       : PE_Byte2Word(this.Stream.Read(2)),    // ページ数
      'e_crlc'     : PE_Byte2Word(this.Stream.Read(2)),    // リロケーションテーブルの項目数
      'e_cparhdr'  : PE_Byte2Word(this.Stream.Read(2)),    // リロケーションテーブルのサイズ(16byte単位)
      'e_minalloc' : PE_Byte2Word(this.Stream.Read(2)),    // 最小必要メモリー(16byte単位)
      'e_maxalloc' : PE_Byte2Word(this.Stream.Read(2)),    // 最大必要メモリー(16byte単位)
      'e_ss'       : PE_Byte2Word(this.Stream.Read(2)),    // スタックセグメントの位置(16byte単位)
      'e_sp'       : PE_Byte2Word(this.Stream.Read(2)),    // スタックポインタ初期値
      'e_csum'     : PE_Byte2Word(this.Stream.Read(2)),    // チェックサム
      'e_ip'       : PE_Byte2Word(this.Stream.Read(2)),    // イニシャル IP値
      'e_cs'       : PE_Byte2Word(this.Stream.Read(2)),    // イニシャル CS値
      'e_lfarlc'   : PE_Byte2Word(this.Stream.Read(2)),    // リロケーションテーブルの位置
      'e_ovno'     : PE_Byte2Word(this.Stream.Read(2)),    // オーバレイ

      // 以下は基本的に未使用
      'e_res'      : this.Stream.Read(8),                  // 予約値 [WORDx4]
      'e_oemid'    : PE_Byte2Word(this.Stream.Read(2)),    // OEM識別子(for e_oeminfo)
      'e_oeminfo'  : PE_Byte2Word(this.Stream.Read(2)),    // OEM情報(e_oemid specific)
      'e_res2'     : this.Stream.Read(20),                 // 予約値 [WORDx10]                                                                                     
      'NextOffset' : PE_Byte2Word(this.Stream.Read(4))     // PEヘッダ位置                                                                                       
    };
                             
    if(this.IMAGE_DOS_HEADER.e_magic !== 'MZ'){
      throw 'This file is not in the EXE / DLL files.';
    }                         
    
    // -------------------------
    //  COFFヘッダ(24byte)
    // -------------------------    
    this.Stream.Pos = this.IMAGE_DOS_HEADER.NextOffset;
    
    this.IMAGE_COFF_HEADER = {
      'Magic'                : PE_Byte2String(this.Stream.Read(4)),  // シグネチャ'PE'
      'Machine'              : PE_Byte2Word(this.Stream.Read(2)),    // マシンタイプ(32bit:0x014c,64bit:0x8664,その他多数)
      'NumberOfSections'     : PE_Byte2Word(this.Stream.Read(2)),    // この次に続くSection Headerの数
      'TimeDateStamp'        : PE_Byte2DWord(this.Stream.Read(4)),   // 作成日時
      'PointerToSymbolTable' : PE_Byte2DWord(this.Stream.Read(4)),   // COFFシンボルテーブル位置(シンボルテーブルが無い場合は0)
      'NumberOfSymbols'      : PE_Byte2DWord(this.Stream.Read(4)),   // シンボルテーブルエントリ数(シンボルテーブルが無い場合は0)
      'SizeOfOptionalHeader' : PE_Byte2Word(this.Stream.Read(2)),    // この次に続くOptionalHeaderのサイズ(32bitは224byte,64bitは240byte)
      'Characteristics'      : PE_Byte2Word(this.Stream.Read(2))     // ファイルの属性
    };
                         
    if(this.IMAGE_COFF_HEADER.Magic !== 'PE'){
      throw '16-bit applications can not read.';
    }            
   
    // -------------------------
    //  Optionalヘッダ
    //  (224byte or 240byte)
    // ------------------------- 
    var Optional_Magic = PE_Byte2Word(this.Stream.Read(2));                  
    this.IMAGE_OPTIONAL_HEADER = {
      'Magic'                   : Optional_Magic,                      // イメージファイルの状態を識別 (32bit:0x10b,64bit:0x20b,ROM:0x107)
      'MajorLinkerVersion'      : this.Stream.Read(1)[0],              // メジャーバージョン番号(リンカ)
      'MinorLinkerVersion'      : this.Stream.Read(1)[0],              // マイナーバージョン番号(リンカ)
      'SizeOfCode'              : PE_Byte2DWord(this.Stream.Read(4)),  // コードセクションのサイズ(コードセクションが複数の場合は合計サイズ) 
      'SizeOfInitializedData'   : PE_Byte2DWord(this.Stream.Read(4)),  // 初期化データセクションのサイズ
      'SizeOfUninitializedData' : PE_Byte2DWord(this.Stream.Read(4)),  // 未初期化データセクションのサイズ
      'AddressOfEntryPoint'     : PE_Byte2DWord(this.Stream.Read(4)),  // 開始アドレス 
      'BaseOfCode'              : PE_Byte2DWord(this.Stream.Read(4))   // コードセクションの先頭アドレス(イメージ ベース相対)
    };
    
    // [32bit]
    if(Optional_Magic !== 0x020B){   
      // データ セクションの先頭アドレス(イメージ ベース相対)       
      this.IMAGE_OPTIONAL_HEADER['BaseOfData'] = PE_Byte2DWord(this.Stream.Read(4));
    }
    
    // *** 以下はWindows NT固有フィールド
    
    // [64bit]
    if(Optional_Magic === 0x020B){   
      // イメージファイルの先頭アドレス(64Kの倍数)
      this.IMAGE_OPTIONAL_HEADER['ImageBase1'] = PE_Byte2DWord(this.Stream.Read(4));
      this.IMAGE_OPTIONAL_HEADER['ImageBase2'] = PE_Byte2DWord(this.Stream.Read(4));
    // [32bit]  
    }else{
      this.IMAGE_OPTIONAL_HEADER['ImageBase']  = PE_Byte2DWord(this.Stream.Read(4));          
    }           
    
    this.IMAGE_OPTIONAL_HEADER['SectionAlignment'] = PE_Byte2DWord(this.Stream.Read(4));            // メモリロード時のセクションのアラインメント        
    this.IMAGE_OPTIONAL_HEADER['FileAlignment'] = PE_Byte2DWord(this.Stream.Read(4));               // 物理時のセクションのアラインメント                   
    this.IMAGE_OPTIONAL_HEADER['MajorOperatingSystemVersion'] = PE_Byte2Word(this.Stream.Read(2));  // 必要なOSのメジャーバージョン             
    this.IMAGE_OPTIONAL_HEADER['MinorOperatingSystemVersion'] = PE_Byte2Word(this.Stream.Read(2));  // 必要なOSのマイナーバージョン        
    this.IMAGE_OPTIONAL_HEADER['MajorImageVersion'] = PE_Byte2Word(this.Stream.Read(2));            // イメージのメジャーバージョン                
    this.IMAGE_OPTIONAL_HEADER['MinorImageVersion'] =  PE_Byte2Word(this.Stream.Read(2));           // イメージのマイナーバージョン          
    this.IMAGE_OPTIONAL_HEADER['MajorSubsystemVersion'] = PE_Byte2Word(this.Stream.Read(2));        // サブシステムのメジャーバージョン        
    this.IMAGE_OPTIONAL_HEADER['MinorSubsystemVersion'] = PE_Byte2Word(this.Stream.Read(2));        // サブシステムのマイナーバージョン        
    this.IMAGE_OPTIONAL_HEADER['Win32VersionValue'] = PE_Byte2DWord(this.Stream.Read(4));           // 予約値          
    this.IMAGE_OPTIONAL_HEADER['SizeOfImage'] = PE_Byte2DWord(this.Stream.Read(4));                 // イメージのサイズ(SectionAlignmentの倍数)        
    this.IMAGE_OPTIONAL_HEADER['SizeOfHeaders'] = PE_Byte2DWord(this.Stream.Read(4));               // DOSスタブ+PEヘッダ+セクションヘッダのサイズ(FileAlignmentの倍数)        
    this.IMAGE_OPTIONAL_HEADER['CheckSum'] = PE_Byte2DWord(this.Stream.Read(4));                    // イメージファイルのチェックサム        
    this.IMAGE_OPTIONAL_HEADER['Subsystem'] = PE_Byte2Word(this.Stream.Read(2));                    // イメージを実行するために必要なサブシステム        
    this.IMAGE_OPTIONAL_HEADER['DllCharacteristics'] = PE_Byte2Word(this.Stream.Read(2));           // DLLの特性   
   
    // [64bit]
    if(Optional_Magic === 0x020B){   
      // 保存するスタックのサイズ
      this.IMAGE_OPTIONAL_HEADER['SizeOfStackReserve1'] = PE_Byte2DWord(this.Stream.Read(4));
      this.IMAGE_OPTIONAL_HEADER['SizeOfStackReserve2'] = PE_Byte2DWord(this.Stream.Read(4));          
      // コミットするスタックのサイズ
      this.IMAGE_OPTIONAL_HEADER['SizeOfStackCommit1'] = PE_Byte2DWord(this.Stream.Read(4));
      this.IMAGE_OPTIONAL_HEADER['SizeOfStackCommit2'] = PE_Byte2DWord(this.Stream.Read(4));
      // 保存するローカルヒープスペースのサイズ
      this.IMAGE_OPTIONAL_HEADER['SizeOfHeapReserve1'] = PE_Byte2DWord(this.Stream.Read(4));
      this.IMAGE_OPTIONAL_HEADER['SizeOfHeapReserve2'] = PE_Byte2DWord(this.Stream.Read(4));
      // コミットするローカルヒープスペースのサイズ
      this.IMAGE_OPTIONAL_HEADER['SizeOfHeapCommit1'] = PE_Byte2DWord(this.Stream.Read(4));
      this.IMAGE_OPTIONAL_HEADER['SizeOfHeapCommit2'] = PE_Byte2DWord(this.Stream.Read(4));
      
    // [32bit]
    }else{
      this.IMAGE_OPTIONAL_HEADER['SizeOfStackReserve'] = PE_Byte2DWord(this.Stream.Read(4));
      this.IMAGE_OPTIONAL_HEADER['SizeOfStackCommit'] = PE_Byte2DWord(this.Stream.Read(4));
      this.IMAGE_OPTIONAL_HEADER['SizeOfHeapReserve'] = PE_Byte2DWord(this.Stream.Read(4));
      this.IMAGE_OPTIONAL_HEADER['SizeOfHeapCommit'] = PE_Byte2DWord(this.Stream.Read(4));
    }              
    
    // ローダフラグ(無効) 
    this.IMAGE_OPTIONAL_HEADER['LoaderFlags'] = PE_Byte2DWord(this.Stream.Read(4));
    // データディクショナリエントリ数  
    this.IMAGE_OPTIONAL_HEADER['NumberOfRvaAndSizes'] = PE_Byte2DWord(this.Stream.Read(4));
    // IMAGE_DATA_DIRECTORY x NumberOfRvaAndSizes 
    this.IMAGE_OPTIONAL_HEADER['DataDirectory'] = new Array() ;
       
    // -------------------------       
    //  DataDirectory
    // -------------------------    
    for(var i=0;i<this.IMAGE_OPTIONAL_HEADER.NumberOfRvaAndSizes;i++){
      this.IMAGE_OPTIONAL_HEADER.DataDirectory[i] = {
        'RVA'  : PE_Byte2DWord(this.Stream.Read(4)), // メモリ上でのテーブルの仮想アドレス(イメージ相対)
        'Size' : PE_Byte2DWord(this.Stream.Read(4))  // メモリ上でのテーブルサイズ(物理サイズで良い)
      };
    }
       
    // -------------------------
    //  Sectionヘッダ
    //  (40byte x NumberOfSections)
    // -------------------------                   
    this.IMAGE_SECTION_HEADER = new Array();
    for(var i=0;i<this.IMAGE_COFF_HEADER.NumberOfSections;i++){
      this.IMAGE_SECTION_HEADER[i] = {
        'Name'                 : PE_Byte2String(this.Stream.Read(8)), // セクション名
        'VirtualSize'          : PE_Byte2DWord(this.Stream.Read(4)),  // メモリ上でのセクションサイズ      
        'VirtualAddress'       : PE_Byte2DWord(this.Stream.Read(4)),  // メモリ上でのセクション仮想アドレス         
        'SizeOfRawData'        : PE_Byte2DWord(this.Stream.Read(4)),  // [物理]セクションのサイズまたはディスク上の初期化されたデータ       
        'PointerToRawData'     : PE_Byte2DWord(this.Stream.Read(4)),  // [物理]セクションの最初のページへのポインタ         
        'PointerToRelocations' : PE_Byte2DWord(this.Stream.Read(4)),  // セクションの再配置エントリへのファイルポインタ       
        'PointerToLinenumbers' : PE_Byte2DWord(this.Stream.Read(4)),  // 行番号エントリ         
        'NumberOfRelocations'  : PE_Byte2Word(this.Stream.Read(2)),   // セクション内の再配置エントリの数      
        'NumberOfLinenumbers'  : PE_Byte2Word(this.Stream.Read(2)),   // セクションの行番号エントリの数         
        'Characteristics'      : PE_Byte2DWord(this.Stream.Read(4))   // セクションの特性(IMAGE_SCNxxx参照)      
      };  
    }    
    
    // -------------------------
    //  コメント1(パディング)
    // ------------------------- 
    // コードセクション直前のコメントを取得する
    // NOTE : 通常は0によるパディングのみですが「稀に固有データ」がある    
    var PointerToRawData = 0;
    for(var i=0;i<this.IMAGE_SECTION_HEADER.length;i++){
      if(this.IMAGE_SECTION_HEADER[i].PointerToRawData !== 0){
        PointerToRawData = this.IMAGE_SECTION_HEADER[i].PointerToRawData;
        break;
      }
    }
    
    if (PointerToRawData === 0) throw 'This file is broken.';
    
    if(PointerToRawData === this.Stream.Pos){
      this._COMMENT1 = new Array(); 
    }else{
      this._COMMENT1 = this.Stream.Read(PointerToRawData - this.Stream.Pos);      
    }
    
    // ------------------------- 
    //  コメント2(固有データ)
    // ------------------------- 
    // PEフォーマットの完結以後にあるコメントを取得する
    // NOTE :通常は存在しないが「稀に固有データ」がある
    var IMAGE_SECTION_HEADER = this.IMAGE_SECTION_HEADER[this.IMAGE_SECTION_HEADER.length-1];
    var lastPos = IMAGE_SECTION_HEADER.PointerToRawData + IMAGE_SECTION_HEADER.SizeOfRawData;
    
    if(lastPos === this.Stream.FileSize){
      this._COMMENT2 = new Array(); 
    }else{  
      this.Stream.Pos = lastPos;
      this._COMMENT2  = this.Stream.Read(this.Stream.FileSize - lastPos); 
    }
    
    // EXE/DLLの圧縮判定なし
    if (!PackedFlg){

      // エキスポート
      this.getExportInfo();
      
      // インポート
      this.getImportInfo();      
      
      // リソース
      this.getResourceInfo();   
              
    // EXE/DLLの圧縮判定あり
    }else{        
      
      // NONE : 圧縮判定は代表的なパックツールのみに対応しています。
      //      : その他のパックツールに対応するには適宜、コードを追加してください。 
      
      // UPX
      this.IsPacked = false;
      if(this.IMAGE_SECTION_HEADER[0].Name.toUpperCase().indexOf('UPX') !== -1 &&
         this.IMAGE_SECTION_HEADER[1].Name.toUpperCase().indexOf('UPX') !== -1){
        this.IsPacked = true;
      } 
      
      // UPX
      if (this.IMAGE_SECTION_HEADER[0].Characteristics === 0xE0000080 &&    
          this.IMAGE_SECTION_HEADER[1].Characteristics === 0xE0000040){
        this.IsPacked = true;
      } 
      
      // ASPACK
      for(var i=0;i<this.IMAGE_SECTION_HEADER.length;i++){
        if (this.IMAGE_SECTION_HEADER[i].Name.toUpperCase().indexOf('ASPACK') !== -1){
          this.IsPacked = true;
          break;
        }
      }
      
      // EXE/DLLが未圧縮ならば
      if(!this.IsPacked){       
             
        // エキスポート
        this.getExportInfo();
         
        // インポート
        this.getImportInfo();
              
        // リソース
        this.getResourceInfo();    
      }
    }
    this.Stream.Pos = 0;
  },  
  
  _CompileResourceStream : function (Edit){

    // ------------------------------------ 
    //  リソース(BIN)の概要
    // ------------------------------------
    //   Resource Directory(連続データ?)
    // ------------------------------------
    //   Resource Directory Entry(*) 
    // ------------------------------------
    //   Resource Directory Strings
    // ------------------------------------
    //   Resource Data
    // ------------------------------------
    // *コンパイラによってはResource Dataの間に存在する場合がある
    //
    // NOTE : このメソッドではResource Directory/Resource Directory Entryを整列して保存します。
    //        Resource Directory Strings/Resource Dataは元からの順番で配置されます。
    
    function WriteResourceDirectory(F,Resource,
                                    ResourceDirectoryTables,ResourceDirectoryEntries,resInfoSize,
                                    level,index,resDataStream){
      // -------------------------        
      //  ResourceDirectoryTables
      //  (16byte)
      // -------------------------
      F.WriteDWord(ResourceDirectoryTables.Characteristics);
      F.WriteDWord(ResourceDirectoryTables.TimeDateStamp);
      F.WriteWord(ResourceDirectoryTables.MajorVersion);
      F.WriteWord(ResourceDirectoryTables.MinorVersion);
      F.WriteWord(ResourceDirectoryTables.NumberofNameEntries);
      F.WriteWord(ResourceDirectoryTables.NumberofIDEntries);
      
      // -------------------------  
      //  ResourceDirectoryEntries
      //  (4byte x 2 x N) 
      // ------------------------- 
      var len = ResourceDirectoryTables.NumberofNameEntries + ResourceDirectoryTables.NumberofIDEntries;
      for(var i=0;i<len;i++){  
         
        // -------------------------  
        //  IntegerIDの算出
        // -------------------------   
        // リソース名称 or ディレクトリ名称
        var IntegerID = 0;
        if(ResourceDirectoryEntries[i].ResourceNameFlg){
           
           // 開始位置
           IntegerID = resInfoSize.Total + resDataStream.getFileSize();
           
           // 文字数  
           resDataStream.WriteWord(ResourceDirectoryEntries[i].ResourceName.length);
          
           // 文字列
           for(var j=0;j<ResourceDirectoryEntries[i].ResourceName.length;j++){
             resDataStream.WriteWord(ResourceDirectoryEntries[i].ResourceName.charCodeAt(j));
           }
           
           // 4 byte boundary padding
           PE_PaddingDword(resDataStream);
         }else{
           IntegerID = ResourceDirectoryEntries[i].IntegerID;
         }   
                           
         // RVA or IntegerID
         // NOTE : 先頭にフラグがある場合はフラグをセットする
         if(ResourceDirectoryEntries[i].DirectoryFlg){
           IntegerID = (IntegerID | 0x80000000 ) >>> 0;
         }  
         F.WriteDWord(IntegerID);         
         
         // -------------------------  
         //  DataEntryOffsetの算出
         // -------------------------          
         var BaseSize = 0; // 基底サイズ
         var AddSize  = 0; // 加算サイズ
         
         // ---------------------------------------------------------------------------
         // NOTE : 基底サイズは次層の開始位置です。
         //        加算サイズは次層のエントリ位置です。inElegant Code :-)
         // 
         // (Example) Resource Directory & Resource Directory Entry
         //
         //  [TYPE]
         //   DirectoryTables(16) + DirectoryEntries(8) x2(x2 = Variable number)
         //  -------------------
         //   32byte = BaseSize1
         //  -------------------
         //  [NAME1]
         //   DirectoryTables(16) + DirectoryEntries(8) x1(x1 = Variable number)   
         //  [NAME2]
         //   DirectoryTables(16) + DirectoryEntries(8) x1(x1 = Variable number)            
         //  -------------------
         //   80byte = BaseSize2       
         //  -------------------
         //  [LANG1]
         //   DirectoryTables(16) + DirectoryEntries(8) x1(x1 = Variable number) 
         //  [LANG2]
         //   DirectoryTables(16) + DirectoryEntries(8) x1(x1 = Variable number) 
         //  -------------------
         //   128byte = BaseSize3       
         //  -------------------        
         //  [Resource Directory Entry] 
         //   ...
         //   ...
         //  -------------------       
         // ---------------------------------------------------------------------------
         
         // Type階層
         if(level === 1){
           BaseSize = resInfoSize.Type;
           
           // 加算するサイズを計算
           for(var j=0;j<i;j++){
             AddSize = AddSize +
                       (4*2) + (2*4) + 
                       (Resource.Name[j].ResourceDirectoryTables.NumberofNameEntries +   
                        Resource.Name[j].ResourceDirectoryTables.NumberofIDEntries) * (4*2);
            
           }
         
         // Name階層            
         }else if(level === 2){     
           BaseSize = resInfoSize.Type + resInfoSize.Name;
           
           // この時点でのLanguageの総エントリ数
           var lang_count = 0;
           
           // 現在のindexのエントリ数
           for(var j=0;j<i;j++){ lang_count++; }
           
           // 現在のindexより前のエントリ数の合計          
           // ex)index = 0 : 未カウント,index = 1 : 0の全てをカウント,index = 2 : 0,1の全てをカウント, ...
           for(var j=0;j<index;j++){
             lang_count +=  Resource.Name[j].ResourceDirectoryTables.NumberofNameEntries + 
                            Resource.Name[j].ResourceDirectoryTables.NumberofIDEntries;
           }
           
           // 加算するサイズを計算
           for(var j=0;j<lang_count;j++){
              AddSize = AddSize +
                       (4*2) + (2*4) + 
                       (Resource.Language[j].ResourceDirectoryTables.NumberofNameEntries + 
                        Resource.Language[j].ResourceDirectoryTables.NumberofIDEntries) * (4*2);
           }
      
         // Lang階層            
         }else if(level === 3){
           BaseSize = resInfoSize.Type + resInfoSize.Name + resInfoSize.Lang;
           
           // この時点でのDirectory Entryの総エントリ数
           var entry_count = 0;
           
           // 現在のindexのエントリ数
           for(var j=0;j<i;j++){ entry_count++; }
           
           // 現在のindexより前のエントリ数の合計          
           for(var j=0;j<index;j++){
             entry_count += Resource.Language[j].ResourceDirectoryTables.NumberofNameEntries + 
                            Resource.Language[j].ResourceDirectoryTables.NumberofIDEntries;
           }
           
           // 加算するサイズを計算
           for(var j=0;j<entry_count;j++){
              AddSize = AddSize + (4*4);
           }
         }         
         var DataEntryOffset =  BaseSize + AddSize;
         
         // DataEntryRVA or SubdirectoryRVA
         // NOTE : 先頭にフラグがある場合はフラグをセットする
         if(ResourceDirectoryEntries[i].SubDirectoryOffsetFlg){
           DataEntryOffset = (DataEntryOffset | 0x80000000 ) >>> 0;
         }else{
           DataEntryOffset = DataEntryOffset;
         }       
         F.WriteDWord(DataEntryOffset);   
      }
    };
        
    var F = new TFileStream();
    var resDataStream  = new TFileStream(); // リソースデータ用(リソース名も含む)    
    
    // リソースRVA
    var Section =  this.getSectionInfo(this.IMAGE_OPTIONAL_HEADER.DataDirectory[2].RVA);
    var ResourceRVA = this.getTableRVA(2,Section.Index);
    
    // リソース全体の取得
    this.Stream.Pos = Section.Pos;
    var ReadStream = new TReadStream(this.Stream.Read(Section.Size));
    
    // -------------------------        
    //  各構造のサイズ
    // -------------------------  
    var resInfoSize = {
                       'Type'  : 0,  // Typeのサイズ
                       'Name'  : 0,  // Nameのサイズ
                       'Lang'  : 0,  // Languageのサイズ
                       'RDE'   : 0,  // Resource Data Entryのサイズ
                       'Total' : 0   // 上記の総計
                       };
    // Type 
    resInfoSize.Type  = (4*2) + (2*4) + 
                        (this.Resource.Type.ResourceDirectoryTables.NumberofNameEntries + 
                         this.Resource.Type.ResourceDirectoryTables.NumberofIDEntries) * (4*2);

    // Name
    for(var i=0;i<this.Resource.Name.length;i++){
      resInfoSize.Name = resInfoSize.Name +
                         (4*2) + (2*4) + 
                         (this.Resource.Name[i].ResourceDirectoryTables.NumberofNameEntries + 
                          this.Resource.Name[i].ResourceDirectoryTables.NumberofIDEntries) * (4*2);
    }

    // Lang
    for(var i=0;i<this.Resource.Language.length;i++){
      resInfoSize.Lang = resInfoSize.Lang +  
                         (4*2) + (2*4) +
                         (this.Resource.Language[i].ResourceDirectoryTables.NumberofNameEntries + 
                          this.Resource.Language[i].ResourceDirectoryTables.NumberofIDEntries) * (4*2);
    }    
   
    // ResourceDataEntry                            
    for(var i=0;i<this.Resource.Language.length;i++){
      resInfoSize.RDE = resInfoSize.RDE + (4*4) * this.Resource.Language[i].ResourceDataEntry.length;
    } 
    
    // 合計
    resInfoSize.Total = resInfoSize.Type + resInfoSize.Name + resInfoSize.Lang + resInfoSize.RDE;
    
    // -------------------------        
    //  Resource Directory
    // -------------------------  
    // Type
    WriteResourceDirectory(F,this.Resource,
                           this.Resource.Type.ResourceDirectoryTables,
                           this.Resource.Type.ResourceDirectoryEntries,
                           resInfoSize,1,null,resDataStream);   
                             
    // Name                           
    for(var i=0;i<this.Resource.Name.length;i++){
      WriteResourceDirectory(F,this.Resource,
                             this.Resource.Name[i].ResourceDirectoryTables,
                             this.Resource.Name[i].ResourceDirectoryEntries,
                             resInfoSize,2,i,resDataStream);      
    }  

    // Lang                            
    for(var i=0;i<this.Resource.Language.length;i++){
      WriteResourceDirectory(F,this.Resource,
                             this.Resource.Language[i].ResourceDirectoryTables,
                             this.Resource.Language[i].ResourceDirectoryEntries,
                             resInfoSize,3,i,resDataStream);      
    }      
    
    // -------------------------        
    //  Resource Data Entry
    // -------------------------     
    // NOTE : 同一のリソースID/言語IDがある場合は動作が不安定になります。
    //      : ※開発者側のミスがないリリース版での同一IDはありえないです。
    for(var i=0;i<this.Resource.Language.length;i++){  

      // リソースの種類
      var ResourceType = this.Resource.Type.ResourceDirectoryEntries[this.Resource.Language[i].parent].IntegerID;   

      for(var j=0;j<this.Resource.Language[i].ResourceDataEntry.length;j++){
        var Stream,DataRVA,Size;
        var resNameID = this.Resource.Language[i].resNameID;
        var resLangID = this.Resource.Language[i].ResourceDirectoryEntries[j].IntegerID;
         
        // Menu
        if(ResourceType === 4 && Edit.Menu.length !== 0){
          
          // メニューリソースのコンパイル          
          for(var k=0;k<Edit.Menu.length;k++){
            if(Edit.Menu[k].resNameID === resNameID && Edit.Menu[k].resLangID === resLangID){              
              var MenuResEncode = new TMenuResEncode();
              Stream = MenuResEncode.SaveToStream(Edit.Menu[k].resObject);               
              break;
            }            
          }
          
        // Dialog
        }else if(ResourceType === 5 && Edit.Dialog.length !== 0){
          
          // ダイアログリソースのコンパイル 
          for(var k=0;k<Edit.Dialog.length;k++){
            if(Edit.Dialog[k].resNameID === resNameID && Edit.Dialog[k].resLangID === resLangID){              
              var DialogResEncode = new TDialogResEncode();
              Stream = DialogResEncode.SaveToStream(Edit.Dialog[k].resObject);               
              break;
            }            
          }
          
        // String Table
        }else if(ResourceType === 6 && Edit.String.length !== 0){

          // 文字列リソースのコンパイル 
          for(var k=0;k<Edit.String.length;k++){
            if(Edit.String[k].resNameID === resNameID && Edit.String[k].resLangID === resLangID){              
              var StringResEncode = new TStringResEncode();
              Stream = StringResEncode.SaveToStream(Edit.String[k].resObject);               
              break;
            }            
          }
          
        }else{
          // 元リソースの取得
          ReadStream.Pos = this.Resource.Language[i].ResourceDataEntry[j].DataRVA - ResourceRVA;;
          Stream = ReadStream.Read(this.Resource.Language[i].ResourceDataEntry[j].Size);         
        }

        // 新しいRVAとリソースサイズ        
        DataRVA = resInfoSize.Total + resDataStream.getFileSize() + ResourceRVA;
        Size    = Stream.length;
        resDataStream.WriteStream(Stream);
          
        // 4 byte boundary padding
        PE_PaddingDword(resDataStream);
          
        F.WriteDWord(DataRVA);
        F.WriteDWord(Size);
        F.WriteDWord(this.Resource.Language[i].ResourceDataEntry[j].Codepage);
        F.WriteDWord(this.Resource.Language[i].ResourceDataEntry[j].Reserved);       
      }    
    }  
    
    // -------------------------        
    //  String & Data
    // -------------------------   
    F.WriteStream(resDataStream.Stream.subarray(0, resDataStream.getFileSize()));     
    
    // 4 byte boundary padding
    PE_PaddingDword(F);
    
    return F.Stream.subarray(0, F.getFileSize());
  },  
  
  // Hide method :-)   
  // NOTE : リソースをコンパイルして保存する
  _CompileResourceFile : function (FileName,Edit){
    var F = new TFileStream();
    F.WriteStream(this._CompileResourceStream(Edit));
    F.SaveToFile(FileName);
  },
     
  SaveToStream : function (Edit){   
    var F = new TFileStream();
    
    // ------------------------------------ 
    //  PEフォーマットの概要
    // ------------------------------------
    //   DOSスタブ(64byte)
    // ------------------------------------
    //   COFFヘッダ(24byte)
    // ------------------------------------
    //   Optionalヘッダ(224byte or 240byte)
    // ------------------------------------
    //   Sectionヘッダ
    // ------------------------------------
    //   コメント1(パディング)
    // ------------------------------------
    //   セクションデータが連続配置
    // ------------------------------------
    //   コメント2
    // ------------------------------------
    
    if(!this.Resource){
      throw 'Do not have the resource.';
    }
    
    // -------------------------
    //  リソースをコンパイル
    // -------------------------
    // リソース情報 
    var Section = this.getSectionInfo(this.IMAGE_OPTIONAL_HEADER.DataDirectory[2].RVA);
    var resIndex = Section.Index;
    var initial_res = this._CompileResourceStream(Edit);     
       
    // -------------------------      
    //  リソースのパディング
    // -------------------------      
    var FileAlign = this.IMAGE_OPTIONAL_HEADER.FileAlignment;
    var padding_res_size = Math.floor((initial_res.length +(FileAlign -1) ) / FileAlign) * FileAlign; 
    var stream = new Uint8Array(padding_res_size);    

    for(var i=0;i<initial_res.length;i++){
      stream[i] = initial_res[i];      
    }
    
    for(var i=initial_res.length;i<padding_res_size;i++){
      stream[i] = 0;      
    }
    var padding_res = stream;
    
    // -------------------------
    //  各種サイズ計算
    // -------------------------      
    // リソースの実サイズ(物理サイズ)     
    var DataDirectory_Size,Section_VirtualSize;
    Section_VirtualSize = DataDirectory_Size = initial_res.length;

    // 初期化データセクションのサイズ(パディング済み)
    // NOTE : リソースセクションには必ずIMAGE_SCN_CNT_INITIALIZED_DATAフラグが含まれるハズ :-)
    //      : 万が一、フラグがない場合はSizeOfUninitializedDataを加減算して下さい。
    var diff = padding_res.length  - this.IMAGE_SECTION_HEADER[resIndex].SizeOfRawData;
    var SizeOfInitializedData = this.IMAGE_OPTIONAL_HEADER.SizeOfInitializedData + diff;

    // イメージのサイズ(メモリ上の総サイズ)       
    var SizeOfImage = 0;              
    var SecAlign = this.IMAGE_OPTIONAL_HEADER.SectionAlignment;     
    for(var i=0;i<this.IMAGE_COFF_HEADER.NumberOfSections;i++){

      // リソース
      if(i === resIndex){
        // 今回の仮想サイズが前回より小さい場合は前回のサイズを使用する
        if(Section_VirtualSize <= this.IMAGE_SECTION_HEADER[resIndex].VirtualSize){
          SizeOfImage += Math.floor((this.IMAGE_SECTION_HEADER[resIndex].VirtualSize +(SecAlign -1) ) / SecAlign) * SecAlign;
        }else{
          SizeOfImage += Math.floor((Section_VirtualSize +(SecAlign -1) ) / SecAlign) * SecAlign;
        }
      }
      
      // その他
      else{            
        SizeOfImage += Math.floor(
                        (this.IMAGE_SECTION_HEADER[i].VirtualSize +(SecAlign -1) ) / SecAlign) * SecAlign;
      }
    }
    // コードセクションの先頭アドレスを加算     
    SizeOfImage += this.IMAGE_OPTIONAL_HEADER.BaseOfCode;        
  
    // 仮想アドレスサイズ(前回/今回)
    var Before_Virtual = Math.floor((this.IMAGE_OPTIONAL_HEADER.DataDirectory[2].Size +(SecAlign -1) ) / SecAlign) * SecAlign;
    var After_Virtual  = Math.floor((DataDirectory_Size +(SecAlign -1) ) / SecAlign) * SecAlign;
                  
    // 物理ファイルサイズ(前回/今回)
    var Before_Physical = this.IMAGE_SECTION_HEADER[resIndex].SizeOfRawData;               
    var After_Physical  = Math.floor((Section_VirtualSize +(FileAlign -1) ) / FileAlign) * FileAlign;

    // -------------------------
    //  DOSスタブ(64byte)
    // -------------------------      
    F.WriteString(this.IMAGE_DOS_HEADER.e_magic);
    F.WriteWord(this.IMAGE_DOS_HEADER.e_cblp);      
    F.WriteWord(this.IMAGE_DOS_HEADER.e_cp);
    F.WriteWord(this.IMAGE_DOS_HEADER.e_crlc);
    F.WriteWord(this.IMAGE_DOS_HEADER.e_cparhdr);
    F.WriteWord(this.IMAGE_DOS_HEADER.e_minalloc);
    F.WriteWord(this.IMAGE_DOS_HEADER.e_maxalloc);
    F.WriteWord(this.IMAGE_DOS_HEADER.e_ss);
    F.WriteWord(this.IMAGE_DOS_HEADER.e_sp);

    // DOSチェックサム(そのまま)
    F.WriteWord(this.IMAGE_DOS_HEADER.e_csum);

    F.WriteWord(this.IMAGE_DOS_HEADER.e_ip);
    F.WriteWord(this.IMAGE_DOS_HEADER.e_cs);
    F.WriteWord(this.IMAGE_DOS_HEADER.e_lfarlc);
    F.WriteWord(this.IMAGE_DOS_HEADER.e_ovno);
    
    for(var i=0; i<this.IMAGE_DOS_HEADER.e_res.length;i++){
       F.WriteByte(this.IMAGE_DOS_HEADER.e_res[i]); 
    }
       
    F.WriteWord(this.IMAGE_DOS_HEADER.e_oemid);     
    F.WriteWord(this.IMAGE_DOS_HEADER.e_oeminfo);     

    for(var i=0; i<this.IMAGE_DOS_HEADER.e_res2.length;i++){
       F.WriteByte(this.IMAGE_DOS_HEADER.e_res2[i]); 
    }
               
    F.WriteDWord(this.IMAGE_DOS_HEADER.NextOffset); 
    
    // -------------------------
    //  DOSイメージ
    // -------------------------        
    this.Stream.Pos = F.getFileSize();
    stream = this.Stream.Read(this.IMAGE_DOS_HEADER.NextOffset - this.Stream.Pos);
    F.WriteStream(stream);

    // -------------------------
    //  COFFヘッダ(24byte)
    // -------------------------
    F.WriteDWord(0x00004550);
    F.WriteWord(this.IMAGE_COFF_HEADER.Machine);
    F.WriteWord(this.IMAGE_COFF_HEADER.NumberOfSections);
    F.WriteDWord(this.IMAGE_COFF_HEADER.TimeDateStamp);
    F.WriteDWord(this.IMAGE_COFF_HEADER.PointerToSymbolTable);
    F.WriteDWord(this.IMAGE_COFF_HEADER.NumberOfSymbols);
    F.WriteWord(this.IMAGE_COFF_HEADER.SizeOfOptionalHeader);
    F.WriteWord(this.IMAGE_COFF_HEADER.Characteristics);
    
    // -------------------------
    //  Optionalヘッダ
    //  (224byte or 240byte)
    // ------------------------- 
    F.WriteWord(this.IMAGE_OPTIONAL_HEADER.Magic);     
    F.WriteByte(this.IMAGE_OPTIONAL_HEADER.MajorLinkerVersion);     
    F.WriteByte(this.IMAGE_OPTIONAL_HEADER.MinorLinkerVersion);         
    F.WriteDWord(this.IMAGE_OPTIONAL_HEADER.SizeOfCode);    
     
    // 初期化データセクションのサイズ 
    F.WriteDWord(SizeOfInitializedData);     

    F.WriteDWord(this.IMAGE_OPTIONAL_HEADER.SizeOfUninitializedData);   
    F.WriteDWord(this.IMAGE_OPTIONAL_HEADER.AddressOfEntryPoint);     
    F.WriteDWord(this.IMAGE_OPTIONAL_HEADER.BaseOfCode);       
    
    if(this.IMAGE_OPTIONAL_HEADER.Magic !== 0x020B){
      F.WriteDWord(this.IMAGE_OPTIONAL_HEADER.BaseOfData); 
    }
        
    if(this.IMAGE_OPTIONAL_HEADER.Magic !== 0x020B){ 
      F.WriteDWord(this.IMAGE_OPTIONAL_HEADER.ImageBase); 
    }else{
      F.WriteDWord(this.IMAGE_OPTIONAL_HEADER.ImageBase1); 
      F.WriteDWord(this.IMAGE_OPTIONAL_HEADER.ImageBase2); 
    }    
      
    F.WriteDWord(this.IMAGE_OPTIONAL_HEADER.SectionAlignment); 
    F.WriteDWord(this.IMAGE_OPTIONAL_HEADER.FileAlignment); 
    F.WriteWord(this.IMAGE_OPTIONAL_HEADER.MajorOperatingSystemVersion); 
    F.WriteWord(this.IMAGE_OPTIONAL_HEADER.MinorOperatingSystemVersion); 
    F.WriteWord(this.IMAGE_OPTIONAL_HEADER.MajorImageVersion);                        
    F.WriteWord(this.IMAGE_OPTIONAL_HEADER.MinorImageVersion); 
    F.WriteWord(this.IMAGE_OPTIONAL_HEADER.MajorSubsystemVersion); 
    F.WriteWord(this.IMAGE_OPTIONAL_HEADER.MinorSubsystemVersion); 
    F.WriteDWord(this.IMAGE_OPTIONAL_HEADER.Win32VersionValue); 
    
    // イメージのサイズ(SectionAlignmentの倍数)  
    F.WriteDWord(SizeOfImage);    

    F.WriteDWord(this.IMAGE_OPTIONAL_HEADER.SizeOfHeaders); 
    
    // イメージファイルのチェックサム    
    // NOTE : Checksum may be 0.
    F.WriteDWord(0);     
   
    F.WriteWord(this.IMAGE_OPTIONAL_HEADER.Subsystem); 
    F.WriteWord(this.IMAGE_OPTIONAL_HEADER.DllCharacteristics); 

    if(this.IMAGE_OPTIONAL_HEADER.Magic !== 0x020B){ 
      F.WriteDWord(this.IMAGE_OPTIONAL_HEADER.SizeOfStackReserve);   
      F.WriteDWord(this.IMAGE_OPTIONAL_HEADER.SizeOfStackCommit); 
      F.WriteDWord(this.IMAGE_OPTIONAL_HEADER.SizeOfHeapReserve); 
      F.WriteDWord(this.IMAGE_OPTIONAL_HEADER.SizeOfHeapCommit);                   
    }else{
      F.WriteDWord(this.IMAGE_OPTIONAL_HEADER.SizeOfStackReserve1);
      F.WriteDWord(this.IMAGE_OPTIONAL_HEADER.SizeOfStackReserve2);            
      F.WriteDWord(this.IMAGE_OPTIONAL_HEADER.SizeOfStackCommit1); 
      F.WriteDWord(this.IMAGE_OPTIONAL_HEADER.SizeOfStackCommit2); 
      F.WriteDWord(this.IMAGE_OPTIONAL_HEADER.SizeOfHeapReserve1); 
      F.WriteDWord(this.IMAGE_OPTIONAL_HEADER.SizeOfHeapReserve2); 
      F.WriteDWord(this.IMAGE_OPTIONAL_HEADER.SizeOfHeapCommit1); 
      F.WriteDWord(this.IMAGE_OPTIONAL_HEADER.SizeOfHeapCommit2); 
    }
    
    F.WriteDWord(this.IMAGE_OPTIONAL_HEADER.LoaderFlags); 
    F.WriteDWord(this.IMAGE_OPTIONAL_HEADER.NumberOfRvaAndSizes);   

    // -------------------------
    //  DataDirectory
    // -------------------------   
    for(var i=0;i<this.IMAGE_OPTIONAL_HEADER.NumberOfRvaAndSizes;i++){
      
      // リソース
      if(i === 2){
        
        F.WriteDWord(this.IMAGE_OPTIONAL_HEADER.DataDirectory[i].RVA); 
        
        // 今回の仮想サイズが前回より小さい場合は前回のサイズを使用する
        if(DataDirectory_Size <= this.IMAGE_OPTIONAL_HEADER.DataDirectory[i].Size){
          F.WriteDWord(this.IMAGE_OPTIONAL_HEADER.DataDirectory[i].Size); 
        }else{
          F.WriteDWord(DataDirectory_Size); 
        }
        
      // その他  
      }else{
        // リソースのRVAより後ろのRVAを変更する
        if(DataDirectory_Size > this.IMAGE_OPTIONAL_HEADER.DataDirectory[2].Size &&  
           this.IMAGE_OPTIONAL_HEADER.DataDirectory[i].RVA !== 0 &&
           this.IMAGE_OPTIONAL_HEADER.DataDirectory[2].RVA <= this.IMAGE_OPTIONAL_HEADER.DataDirectory[i].RVA){                      
          
          // 物理アドレスで加算
          F.WriteDWord(this.IMAGE_OPTIONAL_HEADER.DataDirectory[i].RVA + (After_Physical - Before_Physical)); 
          F.WriteDWord(this.IMAGE_OPTIONAL_HEADER.DataDirectory[i].Size);
        }else{
          F.WriteDWord(this.IMAGE_OPTIONAL_HEADER.DataDirectory[i].RVA); 
          F.WriteDWord(this.IMAGE_OPTIONAL_HEADER.DataDirectory[i].Size); 
        }        
      }      
    }
    
    // -------------------------
    //  Sectionヘッダ
    //  (40byte x NumberOfSections)
    // -------------------------      
    for(var i=0;i<this.IMAGE_COFF_HEADER.NumberOfSections;i++){ 
      
      // セクション名
      var secName = new Uint8Array(8);
      for(var j=0;j<8;j++){ secName[j] = 0; }      
      for(var j=0;j<this.IMAGE_SECTION_HEADER[i].Name.length;j++){
        secName[j] =  this.IMAGE_SECTION_HEADER[i].Name.charCodeAt(j) & 0xFF;
      }   
      F.WriteStream(secName); 
          
      // リソース
      if(i === resIndex){
        
        // 今回の仮想サイズが前回より小さい場合は前回のサイズを使用する
        if(Section_VirtualSize <= this.IMAGE_SECTION_HEADER[resIndex].VirtualSize){
          F.WriteDWord(this.IMAGE_SECTION_HEADER[resIndex].VirtualSize); 
        }else{
          F.WriteDWord(Section_VirtualSize); 
        }          
       
        F.WriteDWord(this.IMAGE_SECTION_HEADER[resIndex].VirtualAddress);         
        F.WriteDWord(After_Physical); 
        F.WriteDWord(this.IMAGE_SECTION_HEADER[resIndex].PointerToRawData);
        
      // その他
      }else{        
        F.WriteDWord(this.IMAGE_SECTION_HEADER[i].VirtualSize); 

        // リソースの仮想アドレスより後ろの仮想アドレスを変更する
        if(Section_VirtualSize > this.IMAGE_SECTION_HEADER[resIndex].VirtualSize && 
           this.IMAGE_SECTION_HEADER[resIndex].VirtualAddress <= this.IMAGE_SECTION_HEADER[i].VirtualAddress){
      
          F.WriteDWord(this.IMAGE_SECTION_HEADER[i].VirtualAddress + (After_Virtual - Before_Virtual)); 
        }else{
          F.WriteDWord(this.IMAGE_SECTION_HEADER[i].VirtualAddress); 
        }        
        
        F.WriteDWord(this.IMAGE_SECTION_HEADER[i].SizeOfRawData); 
      
        // リソースの物理アドレスより後ろの物理アドレスを変更する
        if(this.IMAGE_SECTION_HEADER[resIndex].PointerToRawData <= this.IMAGE_SECTION_HEADER[i].PointerToRawData){
          F.WriteDWord(this.IMAGE_SECTION_HEADER[i].PointerToRawData + (After_Physical - Before_Physical));
        }else{
          F.WriteDWord(this.IMAGE_SECTION_HEADER[i].PointerToRawData);
        }
      }

      // 残りは変更なし 
      F.WriteDWord(this.IMAGE_SECTION_HEADER[i].PointerToRelocations);                                     
      F.WriteDWord(this.IMAGE_SECTION_HEADER[i].PointerToLinenumbers);                                     
      F.WriteWord(this.IMAGE_SECTION_HEADER[i].NumberOfRelocations);   
      F.WriteWord(this.IMAGE_SECTION_HEADER[i].NumberOfLinenumbers);      
      F.WriteDWord(this.IMAGE_SECTION_HEADER[i].Characteristics);
    }
    
    // -------------------------
    //  コメント1
    // ------------------------- 
    if(this._COMMENT1.length !== 0){
      F.WriteStream(this._COMMENT1);
    }

    // -------------------------
    //  セクションデータ
    // -------------------------    
    var stream;
    for(var i=0;i<this.IMAGE_COFF_HEADER.NumberOfSections;i++){ 

      // リソース
      if(i === resIndex){
        
        F.WriteStream(padding_res);
        
      // その他  
      }else{
        this.Stream.Pos = this.IMAGE_SECTION_HEADER[i].PointerToRawData;
        stream = this.Stream.Read(this.IMAGE_SECTION_HEADER[i].SizeOfRawData);   
        F.WriteStream(stream);
      }
    }

    // -------------------------
    //  コメント2
    // ------------------------- 
    if(this._COMMENT2.length !== 0){
      F.WriteStream(this._COMMENT2);
    }   
   
    return F.Stream.subarray(0, F.getFileSize());  
  },
 
  SaveToFile : function (FileName,Edit){   
    var F = new TFileStream();
    F.WriteStream(this.SaveToStream(Edit));
    F.SaveToFile(FileName);    
  }   
}

////////////////////////////////////////////////////////////////////////////////
// Main Class
////////////////////////////////////////////////////////////////////////////////

// ---------------------------
//  TResEditor            
// ---------------------------
function TResEditor(FileName) {
  this.FileName = FileName;
}

// ---------------------------
//  TResEditor.Method     
// ---------------------------
TResEditor.prototype = {

  // リソースをRCファイルへ変換する
  ExtractRCFile : function(ZipFileName){
    var PEAnalyst = this.PEAnalyst;
    
    // リソースが存在する    
    if (PEAnalyst.Resource){           
      var zip = new Zlib.Zip(); 
      var type = PEAnalyst.Resource.Type;
      var lang = PEAnalyst.Resource.Language;
      
      // リソースの種類毎
      for(var i=0;i<type.ResourceDirectoryEntries.length;i++){
        var directory = type.ResourceDirectoryEntries[i].ResourceTypeName;      
        
        for(var j=0;j<lang.length;j++){           
          
          // 同一リソース
          if(lang[j].parent === i){              
              
            for(var k=0;k<lang[j].ResourceDataEntry.length;k++){
                               
              switch (type.ResourceDirectoryEntries[lang[j].parent].IntegerID){
                case  4: break; // Menu
                case  5: break; // Dialog
                case  6: break; // String Table

                // Other format does not create.
                default: continue;                                                                                    
              }
              
              // RAWデータ
              this._BIN.Pos = lang[j].ResourceDataEntry[k].DataRVA - this._ResourceRVA;
              var raw = this._BIN.Read(lang[j].ResourceDataEntry[k].Size); 
              
              // Menu
              var stream;
              if(type.ResourceDirectoryEntries[lang[j].parent].IntegerID === 4){
                var MenuResDecode = new TMenuResDecode;
                var result = MenuResDecode.LoadFromStream(raw); 
                
                var MenuRCEncode = new TMenuRCEncode;                                  
                stream = MenuRCEncode.SaveToStream(lang[j].resNameID,result);   
              }
              
              // Dialog
              if(type.ResourceDirectoryEntries[lang[j].parent].IntegerID === 5){                 
                var DialogResDecode = new TDialogResDecode;
                var result = DialogResDecode.LoadFromStream(raw); 

                var DialogRCEncode = new TDialogRCEncode;                                  
                stream = DialogRCEncode.SaveToStream(lang[j].resNameID,result);    
              }   

              // String Table
              if(type.ResourceDirectoryEntries[lang[j].parent].IntegerID === 6){
                var StringResDecode = new TStringResDecode;
                var result = StringResDecode.LoadFromStream(raw,lang[j].resNameID); 

                var StringRCEncode = new TStringRCEncode;                                  
                stream = StringRCEncode.SaveToStream(result);     
              }                  
              
              // 多言語対応に使用する識別子
              var identifier;
              if (lang[j].ResourceDirectoryEntries[k].ResourceNameFlg){
                identifier = lang[j].ResourceDirectoryEntries[k].ResourceName;
              }else{               
                identifier = lang[j].ResourceDirectoryEntries[k].IntegerID;
              }
              
              // ファイル名
              var filename;                    
              if(lang[j].ResourceDataEntry.length === 1){
                // 多言語未対応
                filename = PE_ConvertCanUseChar(directory,'_') + '\\' + PE_ConvertCanUseChar(lang[j].resNameID,'_') +
                             '@' + PE_ConvertCanUseChar(identifier,'_') + '.rc';
              }else{   
                // 多言語対応                  
                filename = PE_ConvertCanUseChar(directory,'_') + '\\' + PE_ConvertCanUseChar(lang[j].resNameID,'_') +
                             '\\' + PE_ConvertCanUseChar(identifier,'_') + '.rc'; 
              }

              // ZIPへ追加
              zip.addFile(stream,{'filename': PE_ConvertArray(filename),
                                  'compressionMethod':Zlib.Zip.CompressionMethod.STORE});                
            }
          }
        }                            
      }
      
      // ZIP圧縮(無圧縮)
      var compressed = zip.compress();
      
      // ダウンロード
      if(zip.files.length >0){
        var F = new TFileStream();
        
        F.WriteStream(compressed);
        F.SaveToFile(ZipFileName);
        
        return true;
      }else{
        return false;         
      }       
      
    }  
    return false;        
  },
  
  // リソースをResファイルへ変換する
  ExtractResFile : function(ZipFileName){
    var PEAnalyst = this.PEAnalyst;
        
    // リソースが存在する
    if (PEAnalyst.Resource){
      var zip = new Zlib.Zip(); 
      var type = PEAnalyst.Resource.Type;
      var lang = PEAnalyst.Resource.Language;
      
      // リソースの種類毎
      for(var i=0;i<type.ResourceDirectoryEntries.length;i++){
        var directory = type.ResourceDirectoryEntries[i].ResourceTypeName;      
        
        for(var j=0;j<lang.length;j++){           
          
          // 同一リソース
          if(lang[j].parent === i){              
              
            for(var k=0;k<lang[j].ResourceDataEntry.length;k++){             
              var ext;
              
              if (type.ResourceDirectoryEntries[lang[j].parent].ResourceNameFlg){            
                // リボン
                if(type.ResourceDirectoryEntries[lang[j].parent].ResourceName === 'RT_RIBBON_XML'){
                  ext = '.res';
                }else{
                  continue;
                }
              }else{ 

                switch (type.ResourceDirectoryEntries[lang[j].parent].IntegerID){
                  case  1: ext = '.cur'; break; // Cursor
                  case  3: ext = '.ico'; break; // Icon                  

                  case  2: ; // Bitmap
                  case  4: ; // Menu
                  case  5: ; // Dialog
                  case  6: ; // String Table
                  case  9: ; // Accelerator
                  case 10: ; // RCData    
                  case 11: ; // Message Table                                                                                   
                  case 16: ; // Version Info         
                  case 23: ; // HTML                                                                                                 
                  case 24: ; // Manifest  
                  case 28: ; // Ribbon 
                  case 241: ext = '.res'; break; // Toolbar  
                                     
                  // Other format does not create.
                  default: continue;                                                                                    
                }
              }
              
              // RAW
              this._BIN.Pos = lang[j].ResourceDataEntry[k].DataRVA - this._ResourceRVA;
              var raw = this._BIN.Read(lang[j].ResourceDataEntry[k].Size); 
              
              // Cursor
              var stream;
              if(type.ResourceDirectoryEntries[lang[j].parent].IntegerID === 1){
                var CursorResDecode = new TCursorResDecode;
                var result = CursorResDecode.SaveToStream(raw);                                    
                stream = result.Stream;
                            
              // Icon
              }else if(type.ResourceDirectoryEntries[lang[j].parent].IntegerID === 3){
                var IconResDecode = new TIconResDecode;
                var result = IconResDecode.SaveToStream(raw);                                    
                stream = result.Stream;
                
                // PNG format
                if(result.Type === 'PNG'){ 
                  ext = '.png';
                }
              
              // Other  
              }else{                      
               
                // リソースの種類 
                var resType;
                if (type.ResourceDirectoryEntries[lang[j].parent].ResourceNameFlg){
                  resType = type.ResourceDirectoryEntries[lang[j].parent].ResourceName;                  
                }else{
                  resType = type.ResourceDirectoryEntries[lang[j].parent].IntegerID;     
                }
                                  
                // 多言語対応に使用する識別子
                var resType,identifier;
                if (lang[j].ResourceDirectoryEntries[k].ResourceNameFlg){
                  identifier = lang[j].ResourceDirectoryEntries[k].ResourceName;
                }else{
                  identifier = lang[j].ResourceDirectoryEntries[k].IntegerID;
                }
                                    
                // RESエンコード                
                var ResEncode = new TResEncode;
                stream = ResEncode.SaveToStream(resType,lang[j].resNameID,raw);
              }
              
              // ファイル名
              var filename;                    
              if(lang[j].ResourceDataEntry.length === 1){
                // 多言語未対応
                filename = PE_ConvertCanUseChar(directory,'_') + '\\' + PE_ConvertCanUseChar(lang[j].resNameID,'_') +
                             '@' + PE_ConvertCanUseChar(identifier,'_') + ext;
              }else{   
                // 多言語対応                  
                filename = PE_ConvertCanUseChar(directory,'_') + '\\' + PE_ConvertCanUseChar(lang[j].resNameID,'_') +
                             '\\' + PE_ConvertCanUseChar(identifier,'_') + ext; 
              }

              // ZIPへ追加
              zip.addFile(stream,{'filename': PE_ConvertArray(filename),
                                  'compressionMethod':Zlib.Zip.CompressionMethod.STORE}); 
            }
          }
        }                            
      }
      
      // ZIP圧縮(無圧縮)
      var compressed = zip.compress();
      
      // ダウンロード
      if(zip.files.length >0){
        var F = new TFileStream();
        
        F.WriteStream(compressed);
        F.SaveToFile(ZipFileName);
        
        return true;
      }else{
        return false;         
      }      
    }
    return false;        
  },  
  
  // リソースをBINファイルへ変換する
  ExtractBinFile : function(ZipFileName){
    var PEAnalyst = this.PEAnalyst;
    
    // リソースが存在する
    if (PEAnalyst.Resource){
      var zip = new Zlib.Zip(); 
      var type = PEAnalyst.Resource.Type;
      var lang = PEAnalyst.Resource.Language;
      
      // リソースの種類毎
      for(var i=0;i<type.ResourceDirectoryEntries.length;i++){
        var directory = type.ResourceDirectoryEntries[i].ResourceTypeName;      
        
        for(var j=0;j<lang.length;j++){           
          
          // 同一リソース
          if(lang[j].parent === i){              
              
            for(var k=0;k<lang[j].ResourceDataEntry.length;k++){
            
              // RAWデータ
              this._BIN.Pos = lang[j].ResourceDataEntry[k].DataRVA - this._ResourceRVA;
              var stream = this._BIN.Read(lang[j].ResourceDataEntry[k].Size);

              // 多言語対応に使用する識別子
              var identifier;
              if (lang[j].ResourceDirectoryEntries[k].ResourceNameFlg){
                identifier = lang[j].ResourceDirectoryEntries[k].ResourceName;
              }else{
                identifier = lang[j].ResourceDirectoryEntries[k].IntegerID;
              }
              
              // ファイル名
              var filename;                    
              if(lang[j].ResourceDataEntry.length === 1){
                // 多言語未対応
                filename = PE_ConvertCanUseChar(directory,'_') + '\\' + PE_ConvertCanUseChar(lang[j].resNameID,'_') +
                             '@' + PE_ConvertCanUseChar(identifier,'_') + '.bin';
              }else{   
                // 多言語対応                  
                filename = PE_ConvertCanUseChar(directory,'_') + '\\' + PE_ConvertCanUseChar(lang[j].resNameID,'_') +
                             '\\' + PE_ConvertCanUseChar(identifier,'_') + '.bin'; 
              }

              // ZIPへ追加
              zip.addFile(stream,{'filename': PE_ConvertArray(filename),
                                  'compressionMethod':Zlib.Zip.CompressionMethod.STORE}); 
            }
          }
        }                            
      }
      // ZIP圧縮(無圧縮)
      var compressed = zip.compress();
      
      // ダウンロード
      if(zip.files.length >0){
        var F = new TFileStream();
        
        F.WriteStream(compressed);
        F.SaveToFile(ZipFileName);
        
        return true;
      }else{
        return false;         
      }      
    }
    return false;      
  },      
      
  // Hide method :-)   
  // NOTE : 全てのコードセクションを保存する
  _SaveCodeSection : function (ZipFileName){
    var F = new TFileStream();
    var zip = new Zlib.Zip();
    
    // コードセクションの取得
    this.PEAnalyst._getCodeSection();
    if(this.PEAnalyst._CODE_SECTION.length === 0){
      return false;
      // throw 'Code Section information is not there.';
    }
    
    for(var i=0;i<this.PEAnalyst._CODE_SECTION.length;i++){ 
      this.PEAnalyst.Stream.Pos = this.PEAnalyst._CODE_SECTION[i].PointerToRawData;
      var stream = this.PEAnalyst.Stream.Read(this.PEAnalyst._CODE_SECTION[i].SizeOfRawData);   
      
      // ZIPへ追加
      zip.addFile(stream,{'filename': PE_ConvertArray(this.PEAnalyst._CODE_SECTION[i].Name),
                          'compressionMethod':Zlib.Zip.CompressionMethod.STORE});               
    }
    
    // ZIP圧縮(無圧縮)
    var compressed = zip.compress();
    
    // ダウンロード
    var F = new TFileStream();
    F.WriteStream(compressed);
    F.SaveToFile(ZipFileName);
    return true;
  },
  
  // Hide method :-)   
  // NOTE : 全てのデータセクションを保存する
  //      : ※詳細は_getDataSectionメソッドのNOTEを参照 
  _SaveDataSection : function (ZipFileName){
    var F = new TFileStream();
    var zip = new Zlib.Zip();
    
    // コード/データセクションの取得
    this.PEAnalyst._getCodeSection();    
    this.PEAnalyst._getDataSection();
    if(this.PEAnalyst._DATA_SECTION.length === 0){
      return false;
      // throw 'Data Section information is not there.';
    }
    
    for(var i=0;i<this.PEAnalyst._DATA_SECTION.length;i++){ 
      this.PEAnalyst.Stream.Pos = this.PEAnalyst._DATA_SECTION[i].PointerToRawData;
      var stream = this.PEAnalyst.Stream.Read(this.PEAnalyst._DATA_SECTION[i].SizeOfRawData);   
      
      // ZIPへ追加
      zip.addFile(stream,{'filename': PE_ConvertArray(this.PEAnalyst._DATA_SECTION[i].Name),
                          'compressionMethod':Zlib.Zip.CompressionMethod.STORE});               
    }
    
    // ZIP圧縮(無圧縮)
    var compressed = zip.compress();
    
    // ダウンロード
    var F = new TFileStream();
    F.WriteStream(compressed);
    F.SaveToFile(ZipFileName);
    return true;
  },
    
  // Hide method :-)   
  // NOTE : ファイル内にあるCommnet1を丸ごと抽出して保存する
  _SaveCommnet1 : function (FileName){
    if (this.PEAnalyst._COMMENT1.length !==0){
      var F = new TFileStream();
      F.WriteStream(this.PEAnalyst._COMMENT1.subarray(0, this.PEAnalyst._COMMENT1.length));
      F.SaveToFile(FileName);
      return true;
    }else{
      return false;
      // throw 'COMMENT1 information is not there.';
    }
  },
  
  // Hide method :-)   
  // NOTE : ファイル内にあるCommnet2を丸ごと抽出して保存する
  _SaveCommnet2 : function (FileName){
    if (this.PEAnalyst._COMMENT2.length !==0){
      var F = new TFileStream();
      F.WriteStream(this.PEAnalyst._COMMENT2.subarray(0, this.PEAnalyst._COMMENT2.length));
      F.SaveToFile(FileName);
      return true;
    }else{
      return false;      
      // throw 'COMMENT2 information is not there.';
    }
  },
        
  // Hide method :-)   
  // NOTE : ファイル内にある「コンパイル済みリソース」を丸ごと抽出して保存する
  _SaveResourceBinary : function (FileName){   
    var F = new TFileStream();
    F.WriteStream(this._BIN.Stream.subarray(0, this._BIN.FileSize));
    F.SaveToFile(FileName);
    return true;
  },
     
  // Hide method :-)   
  // NOTE : 全てのセクションをZIPファイルで保存する
  _SaveAllSection : function (ZipFileName){   
    var F = new TFileStream();    
    var zip = new Zlib.Zip();
    
    if(this.PEAnalyst.IMAGE_COFF_HEADER.NumberOfSections === 0){
      return false;
    }
    
    for(var i=0;i<this.PEAnalyst.IMAGE_COFF_HEADER.NumberOfSections;i++){ 
      this.PEAnalyst.Stream.Pos = this.PEAnalyst.IMAGE_SECTION_HEADER[i].PointerToRawData;
      var stream = this.PEAnalyst.Stream.Read(this.PEAnalyst.IMAGE_SECTION_HEADER[i].SizeOfRawData);   
      
      // ZIPへ追加
      zip.addFile(stream,{'filename': PE_ConvertArray(this.PEAnalyst.IMAGE_SECTION_HEADER[i].Name),
                          'compressionMethod':Zlib.Zip.CompressionMethod.STORE});               
    }
    
    // ZIP圧縮(無圧縮)
    var compressed = zip.compress();
    
    // ダウンロード
    var F = new TFileStream();
    F.WriteStream(compressed);
    F.SaveToFile(ZipFileName);
    return true;        
  },  
  
  // 全てのエキスポート情報をCSV形式で保存する 
  SaveExportCSV : function (FileName){     
    var PEAnalyst = this.PEAnalyst;
    
    if(PEAnalyst.Export && PEAnalyst.Export.Names.length !== 0){
      var csv = 'Ordinal,Hint,Function,EntryPoint,EntryName\r\n';   
           
      for(var i=0;i<PEAnalyst.Export[PEAnalyst.Export.Names[0]].Ordinal.length;i++){
        csv += PEAnalyst.Export[PEAnalyst.Export.Names[0]].Ordinal[i] + ',';
        csv += PEAnalyst.Export[PEAnalyst.Export.Names[0]].Hint[i] + ',';
        csv += PEAnalyst.Export[PEAnalyst.Export.Names[0]].Function[i] + ',';
        csv += PE_IntToHex(PEAnalyst.Export[PEAnalyst.Export.Names[0]].EntryPoint[i],8) + ',';
        csv += PEAnalyst.Export[PEAnalyst.Export.Names[0]].EntryName[i] + '\r\n';          
      }
      
      var F = new TFileStream();      
      F.WriteStream(PE_ConvertArray(csv));
      
      if(typeof FileName === "undefined"){
        F.SaveToFile(PEAnalyst.Export.Names[0] + '.csv');
      }else{
        F.SaveToFile(FileName);
      }     
      
      return true;
            
    }else{
      return false;
      // throw 'Export information is not there.';
    }
  },
  
  // 全てのインポート情報をテキスト形式で保存する   
  SaveImportTEXT : function (FileName){     
    var PEAnalyst = this.PEAnalyst;
    if(PEAnalyst.Import && PEAnalyst.Import.Names.length !== 0){
      var txt ='';
      var count = 0;
      
      // APIの合計数
      for(var i=0;i<PEAnalyst.Import.Names.length;i++){
        for(var j=0;j<PEAnalyst.Import[PEAnalyst.Import.Names[i]].length;j++){
           count++;
        }
      }      
      
      txt += '----------------------------------------------------------------------\r\n';        
      txt += 'Import DLL ' + PEAnalyst.Import.Names.length + ' Total API '+ count +'\r\n';  
      txt += '----------------------------------------------------------------------\r\n';  
      for(var i=0;i<PEAnalyst.Import.Names.length;i++){
        txt += PEAnalyst.Import.Names[i] +'\r\n';
      }
      
      for(var i=0;i<PEAnalyst.Import.Names.length;i++){
        txt += '----------------------------------------------------------------------\r\n';
        txt += '['+ PEAnalyst.Import.Names[i] +']\r\n'; 
        txt += '----------------------------------------------------------------------\r\n';          
        for(var j=0;j<PEAnalyst.Import[PEAnalyst.Import.Names[i]].length;j++){
          txt += PEAnalyst.Import[PEAnalyst.Import.Names[i]][j] + '\r\n';
        }
      }
     
      var F = new TFileStream();      
      F.WriteStream(PE_ConvertArray(txt));

      F.SaveToFile(FileName);
      
      return true;
            
    }else{
      return false;      
      // throw 'Import information is not there.';
    }    
  },  
    
  LoadFromStream : function (AStream,ResourceFlg,PackedFlg){   
     
    // PEファイルの読み込み
    this.PEAnalyst = new TPEAnalyst();
    try{
      var PEAnalyst = this.PEAnalyst;
      
      if (typeof PackedFlg === "undefined" || PackedFlg) {
        // 圧縮判定あり
        PEAnalyst.LoadFromStream(AStream,true); 
      }else{
        // 圧縮判定なし
        // NOTE : 圧縮判定なしにする場合はResourceFlgをfalseにする事を推奨します。
        //        ※パックツールなどでEXE/DLLファイルが圧縮されている場合に
        //          リソースを読み込むとエラーが発生する可能性がある為です。
        PEAnalyst.LoadFromStream(AStream,false); 
      }          
      
      // OS
      if(PEAnalyst.IMAGE_OPTIONAL_HEADER.Magic === 0x020B){
        this.OS = '64bit';
      }else{
        this.OS = '32bit';
      }       
      // リソースの展開
      // NOTE : コンパイル済みリソースを展開して編集可能状態にする
      if(ResourceFlg){
        
        this.Edit = {'Menu' : new Array(),'Dialog' : new Array(), 'String' : new Array()};                    
        
        if(PEAnalyst.Resource){
          
          // リソースRVA
          var Section =  PEAnalyst.getSectionInfo(PEAnalyst.IMAGE_OPTIONAL_HEADER.DataDirectory[2].RVA);
          this._ResourceRVA = PEAnalyst.getTableRVA(2,Section.Index);

          // リソース全体の取得
          PEAnalyst.Stream.Pos = Section.Pos;
          this._BIN = new TReadStream(PEAnalyst.Stream.Read(Section.Size));
          
          for(var i=0;i<PEAnalyst.Resource.Language.length;i++){  
            
            // リソースの種類
            var ResourceType = PEAnalyst.Resource.Type.ResourceDirectoryEntries[PEAnalyst.Resource.Language[i].parent].IntegerID;
            
            // NOTE : You can add the other type :-)
            if(ResourceType === 4 || // Menu
               ResourceType === 5 || // Dialog
               ResourceType === 6){  // String Table
              
              // リソースID(文字列の場合もある)
              var resNameID = PEAnalyst.Resource.Language[i].resNameID;    
              for(var j=0;j<PEAnalyst.Resource.Language[i].ResourceDataEntry.length;j++){
                
                // 言語ID
                var resLangID = PEAnalyst.Resource.Language[i].ResourceDirectoryEntries[j].IntegerID;
                
                // 該当リソースの取得
                this._BIN.Pos = PEAnalyst.Resource.Language[i].ResourceDataEntry[j].DataRVA - this._ResourceRVA;
                var resStream = this._BIN.Read(PEAnalyst.Resource.Language[i].ResourceDataEntry[j].Size);
                
                // Menu
                var resObject;
                if (ResourceType === 4){

                  // メニューの展開 
                  var MenuResDecode = new TMenuResDecode();
                  resObject = MenuResDecode.LoadFromStream(resStream);
                  
                  this.Edit.Menu[this.Edit.Menu.length] = 
                    {'resNameID' : resNameID,'resLangID' : resLangID, 'resObject' : resObject};
                    
                // Dialog    
                }else if (ResourceType === 5){
                  
                  // ダイアログの展開 
                  var DialogResDecode = new TDialogResDecode();
                  resObject = DialogResDecode.LoadFromStream(resStream);
                  
                  this.Edit.Dialog[this.Edit.Dialog.length] = 
                    {'resNameID' : resNameID,'resLangID' : resLangID, 'resObject' : resObject};
                    
                // String Table    
                }else if (ResourceType === 6){

                  // 文字列テーブルの展開 
                  var StringResDecode = new TStringResDecode();
                  resObject = StringResDecode.LoadFromStream(resStream,resNameID);
                  
                  this.Edit.String[this.Edit.String.length] = 
                    {'resNameID' : resNameID,'resLangID' : resLangID, 'resObject' : resObject};                  
                }                     
              }             
            }
          }
          this._BIN.Pos = 0;
          PEAnalyst.Stream.Pos = 0;
        }
      }
    }catch(e){
      throw e;
    }
  },
  
  SaveToStream : function (){       
    
    if(!this.Edit) {
       throw 'None,Edit property.';
    }
        
    try{
      return this.PEAnalyst.SaveToStream(this.Edit);     
    }catch(e){
      throw e;
    }    
  },
    
  SaveToFile : function (FileName){ 
          
    if(!this.Edit) {
       throw 'None,Edit property.';
    }
              
    try{
      this.PEAnalyst.SaveToFile(FileName,this.Edit);     
    }catch(e){
      throw e;
    }    
  }
}
