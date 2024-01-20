import {Platform, StyleSheet, Text, TextInput, TouchableOpacity, View} from 'react-native';
import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import { Ionicons } from '@expo/vector-icons';
import SoundPlayer from 'react-native-sound-player';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import BottomSheet from '@gorhom/bottom-sheet';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Torch from 'react-native-torch';


const morseCode: { [index: string]: string } = {
  a: '.-',
  b: '-...',
  c: '-.-.',
  d: '-..',
  e: '.',
  f: '..-.',
  g: '--.',
  h: '....',
  i: '..',
  j: '.---',
  k: '-.-',
  l: '.-..',
  m: '--',
  n: '-.',
  o: '---',
  p: '.--.',
  q: '--.-',
  r: '.-.',
  s: '...',
  t: '-',
  u: '..-',
  v: '...-',
  w: '.--',
  x: '-..-',
  y: '-.--',
  z: '--..',
  '1': '.----',
  '2': '..---',
  '3': '...--',
  '4': '....-',
  '5': '.....',
  '6': '-....',
  '7': '--...',
  '8': '---..',
  '9': '----.',
  '0': '-----',
  ' ': '/',
  '.': '.-.-.-',
  ',': '--..--',
  '?': '..--..',
  "'": '.----.',
  '!': '-.-.--',
  '/': '-..-.',
  '(': '-.--.',
  ')': '-.--.-',
  '&': '.-...',
  ':': '---...',
  ';': '-.-.-.',
  '=': '-...-',
  '+': '.-.-.',
  '-': '-....-',
  _: '..--.-',
  '"': '.-..-.',
  $: '...-..-',
  '@': '.--.-.',
  '¿': '..-.-',
  '¡': '--...-',
  '\n': '.-.-',
};

const morseCodeReversed: { [index: string]: string } = {
  '.-': 'a',
  '-...': 'b',
  '-.-.': 'c',
  '-..': 'd',
  '.': 'e',
  '..-.': 'f',
  '--.': 'g',
  '....': 'h',
  '..': 'i',
  '.---': 'j',
  '-.-': 'k',
  '.-..': 'l',
  '--': 'm',
  '-.': 'n',
  '---': 'o',
  '.--.': 'p',
  '--.-': 'q',
  '.-.': 'r',
  '...': 's',
  '-': 't',
  '..-': 'u',
  '...-': 'v',
  '.--': 'w',
  '-..-': 'x',
  '-.--': 'y',
  '--..': 'z',
  '.----': '1',
  '..---': '2',
  '...--': '3',
  '....-': '4',
  '.....': '5',
  '-....': '6',
  '--...': '7',
  '---..': '8',
  '----.': '9',
  '-----': '0',
  '/': ' ',
  '.-.-.-': '.',
  '--..--': ',',
  '..--..': '?',
  '.----.': "'",
  '-.-.--': '!',
  '-..-.': '/',
  '-.--.': '(',
  '-.--.-': ')',
  '.-...': '&',
  '---...': ':',
  '-.-.-.': ';',
  '-...-': '=',
  '.-.-.': '+',
  '-....-': '-',
  '..--.-': '_',
  '.-..-.': '"',
  '...-..-': '$',
  '.--.-.': '@',
  '..-.-': '¿',
  '--...-': '¡',
  '.-.-': '\n',
};

type TypeState = 'Morse' | 'Normal';

function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

interface ButtonSetProps {
  handleSymbolPress: (symbol: string) => void;
  handleClearLast: () => void;
  handleClearAll: () => void;
}
const ButtonSet: React.FC<ButtonSetProps> = ({
  handleSymbolPress,
  handleClearAll,
  handleClearLast,
}) => {
  return (
    <View style={styles.morseButtonWrapper}>
      <TouchableOpacity style={styles.morseButton} onPress={() => handleSymbolPress('.')}>
        <Text style={styles.morseButtonText}>*</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.morseButton} onPress={() => handleSymbolPress('-')}>
        <Text style={styles.morseButtonText}>-</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.morseButton} onPress={() => handleSymbolPress(' / ')}>
        <Text style={styles.morseButtonText}>/</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.morseButton} onPress={() => handleSymbolPress(' ')}>
        <Ionicons name="code-outline" size={32} color="white" />
      </TouchableOpacity>
      <TouchableOpacity style={styles.morseButton} onPress={handleClearAll}>
        <Ionicons name="trash" size={32} color="white" />
      </TouchableOpacity>
      <TouchableOpacity style={styles.morseButton} onPress={handleClearLast}>
        <Ionicons name="backspace" size={32} color="white" />
      </TouchableOpacity>
    </View>
  );
};

export default function App() {
  const [typingState, setTypingState] = useState<TypeState>('Normal');
  const [input, setInput] = useState('');
  const [morseCodeInput, setMorseCodeInput] = useState('');
  const [interval, setInterval] = useState(200);
  const [torchAllowed, setTorchAllowed] = useState(false)
  const isPlaying = useRef(false);
  const isFlashing = useRef(false);

  const bottomSheetRef = useRef<BottomSheet>(null);

  const snapPoints = useMemo(() => [100], []);

  const handleSheetChanges = useCallback((index: number) => {
    if (index === -1) setTypingState('Normal');
  }, []);

  const convertToMorse = useCallback((text: string) => {
    let inputTextLower = text.toLowerCase(); // Handle case sensitivity
    let morse = '';
    for (let char of inputTextLower) {
      morse += (morseCode[char] || '') + ' '; // Add space between every Morse code letters
    }
    setMorseCodeInput(morse);
  }, []);

  const handleTextInputChange = useCallback((text: string) => {
    setInput(text);
    convertToMorse(text);
  }, []);

  const playSound = useCallback(async () => {
    try {
      isPlaying.current = true;
      for (let l of morseCodeInput) {
        if (!isPlaying.current) break;
        var duration = interval;
        var shouldPlay = true;
        if (l === '-') {
          duration = 3 * interval;
        } else if (l === '/') {
          duration = 5 * interval;
        }

        if (l === ' ' || l === '/') {
          shouldPlay = false;
        }

        if (shouldPlay) SoundPlayer.playSoundFile('beep', 'mp3');

        await delay(duration);

        if (shouldPlay) SoundPlayer.pause();
      }
    } catch (e) {
      console.log(`cannot play the sound file`, e);
    } finally {
      isPlaying.current = false;
    }
  }, [morseCodeInput, isPlaying.current]);

  const stopSound = useCallback(() => {
    isPlaying.current = false;
    SoundPlayer.stop();
  }, []);

  const flashLightStart = useCallback(async () => {
    try {
      isFlashing.current = true;
      for (let l of morseCodeInput) {
        if (!isFlashing.current) break;
        var duration = interval;
        var shouldPlay = true;
        if (l === '-') {
          duration = 3 * interval;
        } else if (l === '/') {
          duration = 5 * interval;
        }

        if (l === ' ' || l === '/') {
          shouldPlay = false;
        }

        if (shouldPlay) await Torch.switchState(true);

        await delay(duration/2);

        if (shouldPlay) await Torch.switchState(false);
        await delay(duration/2);

      }
    } catch (e) {
      console.log(`cannot play the sound file`, e);
    } finally {
      isFlashing.current = false;
    }
  }, [morseCodeInput,isFlashing.current, torchAllowed]);

  const flashLightStop = useCallback(() => {
    Torch.switchState(false);
    isFlashing.current = false;
  }, [torchAllowed]);

  useEffect(() => {
    const request = async () => {
      if (Platform.OS === 'ios') {
        setTorchAllowed(true);
        Torch.switch(false);
      } else {
        const cameraAllowed = await Torch.requestCameraPermission(
            'Camera Permissions',
            'We require camera permissions to use the torch on the back of your phone.'
        );

        setTorchAllowed(cameraAllowed);
        if(cameraAllowed){
          Torch.switch(false);
        }
      }
    }

    request()

  }, []);

  const toggleTypingState = useCallback(() => {
    bottomSheetRef.current?.expand();
    if (typingState === 'Normal') {
      setTypingState('Morse');
    } else {
      setTypingState('Normal');
    }
  }, [typingState]);

  const morseToEnglish = useCallback((input: string): string => {
    const simplifiedInput = input.replace(/ +/g, ' ');

    const morseWords = simplifiedInput.split(' ');

    let result = '';

    for (let i = 0; i < morseWords.length; i++) {
      const morseLetter = morseWords[i];
      if (morseCodeReversed[morseLetter]) {
        result += morseCodeReversed[morseLetter];
      }
    }

    return result;
  }, []);

  const handleSymbolPress = useCallback(
    (symbol: string) => {
      if (typingState === 'Morse') {
        setMorseCodeInput(prev => {
          let res = morseToEnglish(`${prev}${symbol}`);
          setInput(res);
          return `${prev}${symbol}`;
        });
      }
    },
    [typingState],
  );

  const handleClearAll = useCallback(() => {
    setMorseCodeInput('');
    setInput('');
  }, []);

  const handleClearLast = useCallback(() => {
    if (typingState === 'Morse' && morseCodeInput.length > 0) {
      setMorseCodeInput(prev => {
        const newValue = prev.slice(0, -1);

        const newInput = morseToEnglish(newValue);
        setInput(newInput);
        return newValue;
      });
    }
  }, [typingState, morseCodeInput]);

  return (
    <GestureHandlerRootView style={{ height: '100%' }}>
      <SafeAreaView style={styles.container}>
        <StatusBar style="auto" />
        <Text style={styles.title}>Morse code Translator</Text>
        <View style={styles.inputRow}>
          <TextInput
            value={input}
            onChangeText={handleTextInputChange}
            style={styles.input}
            placeholder={
              typingState === 'Normal' ? 'Type here code to translate' : 'Your translated code'
            }
            textAlign={'left'}
            numberOfLines={3}
            multiline={true}
            editable={typingState === 'Normal'}
          />
          <TouchableOpacity style={styles.clearButton} onPress={handleClearAll}>
            <Ionicons name="close-circle" size={32} color="black" />
          </TouchableOpacity>
        </View>
        {(input.length > 0 || morseCodeInput.length > 0) && (
          <View style={styles.buttonsWrapper}>
            <Text style={styles.morseCodeLabel}> Morse code: </Text>
            <View style={{ flexDirection: 'row' }}>
              <TouchableOpacity style={styles.stopButton} onPress={stopSound}>
                <Ionicons name="stop-circle" size={32} color="black" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.playButton} onPress={playSound}>
                <Ionicons name="play-circle" size={32} color="black" />
              </TouchableOpacity>
              {torchAllowed && <TouchableOpacity style={styles.flashLightButton} onPress={flashLightStart}>
                <Ionicons name="flash" size={32} color="black"/>
              </TouchableOpacity>}
              {torchAllowed && <TouchableOpacity style={styles.flashLightButton} onPress={flashLightStop}>
              <Ionicons name="flash-off" size={32} color="black"/>
            </TouchableOpacity>}
            </View>
          </View>
        )}
        <Text style={styles.morseCode}>{morseCodeInput}</Text>
        <TouchableOpacity style={styles.toggleTypingButton} onPress={toggleTypingState}>
          <Ionicons name="swap-horizontal" size={32} color="white" />
        </TouchableOpacity>
        <BottomSheet
          ref={bottomSheetRef}
          index={-1}
          snapPoints={snapPoints}
          enablePanDownToClose={true}
          onChange={handleSheetChanges}
        >
          <ButtonSet
            handleClearAll={handleClearAll}
            handleClearLast={handleClearLast}
            handleSymbolPress={handleSymbolPress}
          />
        </BottomSheet>
      </SafeAreaView>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#282c34',
    alignItems: 'center',
    padding: 10,
  },
  title: {
    fontSize: 32,
    color: '#e3e3e3',
    marginBottom: 20,
  },
  input: {
    backgroundColor: '#f3f3f3',
    fontSize: 18,
    width: '100%',
    height: 60,
    paddingLeft: 10,
    paddingRight: 50,
    borderRadius: 10,
    textAlign: 'center',
    paddingVertical: 4,
  },
  inputWrapper: {
    paddingHorizontal: 20,
    width: '100%',
  },
  morseCodeLabel: {
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
  buttonsWrapper: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  playButton: {
    padding: 12,
  },
  stopButton: {
    padding: 12,
  },
  flashLightButton: {
    padding: 12,
  },
  toggleTypingButton: {
    padding: 12,
    position: 'absolute',
    bottom: 16,
    right: 16,
  },
  morseButtonWrapper: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  morseButton: {
    backgroundColor: '#282c34',
    padding: 10,
    borderRadius: 30,
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  morseButtonText: {
    color: 'white',
    fontSize: 28,
  },
});
