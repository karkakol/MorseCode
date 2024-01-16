import {Keyboard, StyleSheet, Text, TextInput, TouchableOpacity, TouchableWithoutFeedback, View} from 'react-native';
import {useCallback, useEffect, useRef, useState} from "react";
import {Ionicons} from "@expo/vector-icons";
import {SafeAreaView} from 'react-native-safe-area-context';
import SoundPlayer from 'react-native-sound-player'


const morseCode: {[index: string]:string} = {
  'a': '.-', 'b': '-...', 'c': '-.-.', 'd': '-..', 'e': '.', 'f': '..-.', 'g': '--.', 'h': '....',
  'i': '..', 'j': '.---', 'k': '-.-', 'l': '.-..', 'm': '--', 'n': '-.', 'o': '---', 'p': '.--.',
  'q': '--.-', 'r': '.-.', 's': '...', 't': '-', 'u': '..-', 'v': '...-', 'w': '.--', 'x': '-..-',
  'y': '-.--', 'z': '--..', '1': '.----', '2': '..---', '3': '...--', '4': '....-', '5': '.....',
  '6': '-....', '7': '--...', '8': '---..', '9': '----.', '0': '-----', ' ': '/',
  '.': '.-.-.-', ',': '--..--', '?': '..--..', '\'': '.----.', '!': '-.-.--', '/': '-..-.',
  '(': '-.--.', ')': '-.--.-', '&': '.-...', ':': '---...', ';': '-.-.-.', '=': '-...-',
  '+': '.-.-.', '-': '-....-', '_': '..--.-', '\"': '.-..-.', '$': '...-..-', '@': '.--.-.',
  '¿': '..-.-', '¡': '--...-', '\n': '.-.-'
};

function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export default function App() {
  const [input, setInput] = useState("");
  const [morseCodeInput, setMorseCodeInput] = useState("")
  const [interval, setInterval] = useState(200)
  const isPlaying = useRef(false);

  const convertToMorse = useCallback(() => {
    let inputTextLower = input.toLowerCase(); // Handle case sensitivity
    let morse = '';
    for (let char of inputTextLower) {
      morse += (morseCode[char] || '') + ' '; // Add space between every Morse code letters
    }
    setMorseCodeInput(morse);
  },[input]);
  useEffect(convertToMorse, [input]);
  const playSound = useCallback(async () => {
    try {
      isPlaying.current = true;
      for(let l of  morseCodeInput){
        if(!isPlaying.current)
          break;
        var duration = interval;
        var shouldPlay = true;
        if(l==='-'){
          duration = 3*interval;
        }else if(l==="/"){
          duration = 5*interval;
        }

        if(l===" " || l==="/"){
          shouldPlay = false;
        }

        if(shouldPlay)
          SoundPlayer.playSoundFile("beep","mp3");

        await delay(duration);

        if(shouldPlay)
          SoundPlayer.pause();
      }
    } catch (e) {
      console.log(`cannot play the sound file`, e);
    } finally {
      isPlaying.current = false;
    }
  },[morseCodeInput, isPlaying.current]);

  const stopSound = useCallback(() => {
    isPlaying.current = false;
    SoundPlayer.stop();
  }, []);

  return (
      <View style={styles.container}>
            <Text style={styles.title}>Morse code Translator</Text>
            <View style={styles.inputRow}>
              <TextInput value={input} onChangeText={setInput} style={styles.input} placeholder={"Type here code to translate"} textAlign={"left"} numberOfLines={3} multiline={true}/>
              <TouchableOpacity style={styles.clearButton} onPress={() => setInput("")}>
                <Ionicons name="close-circle" size={32} color="black"/>
              </TouchableOpacity>
            </View>
            {input.length > 0 && <Text style={styles.morseCodeLabel}> Morse code: </Text>}
            <Text style={styles.morseCode}>{morseCodeInput}</Text>
            <TouchableOpacity style={styles.playButton} onPress={playSound}>
              <Ionicons name="play-circle" size={32} color="black"/>
            </TouchableOpacity>
        <TouchableOpacity style={styles.stopButton} onPress={stopSound}>
          <Ionicons name="stop-circle" size={32} color="black"/>
        </TouchableOpacity>

      </View>

  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#282c34',
    alignItems: 'center',
    padding: 10,
  },
  title:{
    fontSize: 32,
    color: '#e3e3e3',
    marginBottom: 20,
  },
  input:{
    backgroundColor: '#f3f3f3',
    fontSize: 18,
    width: "100%",
    height: 60,
    paddingLeft: 10,
    paddingRight: 50,
    borderRadius: 10,
    textAlign: 'center',
    paddingVertical: 4,
  },
  inputWrapper:{
    paddingHorizontal: 20,
    width: "100%"
  },
  morseCodeLabel:{
    alignSelf: 'flex-start',
    fontSize: 16,
    color: '#dbdbdb',
    marginVertical: 16,
  },
  morseCode: {
    color: '#dbdbdb',
    fontSize: 18,
    fontFamily: 'monospace',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearButton: {
    position: 'absolute',
    right: 8,
  },
  playButton: {
    position: 'absolute',
    bottom: 30,
    right: 30,
  },
  stopButton: {
    position: 'absolute',
    bottom: 30,
    left: 30,
  },
});
