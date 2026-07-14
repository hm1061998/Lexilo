import * as Speech from 'expo-speech';
export class TextToSpeechService{speak(text:string,options?:{language?:string;rate?:number}){Speech.stop();Speech.speak(text,{language:options?.language??'en-US',rate:options?.rate??.9})}stop(){return Speech.stop()}isSpeaking(){return Speech.isSpeakingAsync()}}
