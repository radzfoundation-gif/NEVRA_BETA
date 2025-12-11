# 🎤 Voice Call Feature - Nevra Tutor

## Overview

Fitur voice call memungkinkan user untuk berbicara langsung dengan AI Tutor secara real-time menggunakan speech-to-text dan text-to-speech.

## Fitur

### ✅ Yang Sudah Diimplementasi

1. **Speech Recognition (Speech-to-Text)**
   - Menggunakan Web Speech API (Chrome/Edge)
   - Continuous listening mode
   - Real-time transcript display
   - Auto-restart setelah AI selesai berbicara

2. **Text-to-Speech**
   - AI response diucapkan dengan suara
   - Natural voice dengan rate 0.9
   - Auto-resume listening setelah speaking

3. **Call Controls**
   - 🟢 Start Call - Mulai voice conversation
   - 🔴 End Call - Akhiri call
   - 🔇 Mute/Unmute - Toggle microphone
   - 🔊 Speaker On/Off - Toggle speaker output

4. **UI Features**
   - Real-time transcript display
   - Conversation history
   - Status indicators (Listening, Speaking, Muted)
   - Modern, responsive design

5. **Integration**
   - Terintegrasi dengan ChatInterface
   - Hanya muncul di Tutor Mode
   - Messages dari voice call disimpan ke chat history
   - Menggunakan provider AI yang sama (Groq/DeepSeek/OpenAI)

## Cara Menggunakan

1. **Masuk ke Tutor Mode**
   - Pilih "Tutor Mode" saat memulai chat
   - Atau ubah mode dari Builder ke Tutor

2. **Buka Voice Call**
   - Klik tombol 🟢 Phone icon di header (hanya muncul di Tutor Mode)
   - Modal voice call akan muncul

3. **Start Call**
   - Klik tombol hijau "Start Call"
   - Berikan permission untuk microphone
   - AI akan menyapa dengan suara

4. **Berbicara**
   - Bicara secara natural
   - AI akan mendengarkan dan merespons dengan suara
   - Transcript muncul di layar secara real-time

5. **Controls**
   - **Mute**: Klik tombol mic untuk mute/unmute
   - **Speaker**: Klik tombol speaker untuk on/off
   - **End Call**: Klik tombol merah untuk mengakhiri

## Browser Support

- ✅ **Chrome/Edge**: Full support (Web Speech API)
- ✅ **Safari**: Partial support (webkitSpeechRecognition)
- ❌ **Firefox**: Not supported (gunakan Chrome/Edge)

## Technical Details

### Technologies Used
- **Web Speech API**: Speech recognition & synthesis
- **React Hooks**: State management
- **AI Integration**: Menggunakan generateCode function yang sama

### File Structure
- `components/VoiceCall.tsx` - Main voice call component
- `components/pages/ChatInterface.tsx` - Integration dengan chat

### State Management
- `isCalling`: Status call aktif/tidak
- `isListening`: Status sedang mendengarkan
- `isSpeaking`: Status AI sedang berbicara
- `isMuted`: Status microphone muted
- `isSpeakerOn`: Status speaker on/off
- `conversationHistory`: History percakapan untuk display

## Limitations

1. **Browser Support**: Hanya Chrome/Edge yang fully supported
2. **Language**: Default English (en-US), bisa diubah di code
3. **Response Length**: AI response dibatasi 300 words untuk voice
4. **Network**: Membutuhkan koneksi internet untuk AI API

## Future Enhancements

- [ ] Multi-language support
- [ ] Video call (jika diperlukan)
- [ ] Recording conversation
- [ ] Better error handling untuk network issues
- [ ] Voice activity detection (VAD)
- [ ] Echo cancellation

## Troubleshooting

### Microphone tidak bekerja
- Pastikan browser permission untuk microphone sudah diberikan
- Cek browser settings untuk microphone access
- Restart browser jika perlu

### Speech recognition tidak start
- Pastikan menggunakan Chrome atau Edge
- Cek console untuk error messages
- Pastikan microphone tidak digunakan aplikasi lain

### AI tidak merespons
- Cek koneksi internet
- Cek API keys di environment variables
- Lihat console untuk error details
