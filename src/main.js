import Tesseract from 'tesseract.js';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc } from 'firebase/firestore';

// --- PEGA AQUÍ TUS LLAVES DE FIREBASE ---
const firebaseConfig = {
  apiKey: "AIzaSy...",
  authDomain: "app-estacion-db.firebaseapp.com",
  projectId: "app-estacion-db",
  storageBucket: "app-estacion-db.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef..."
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

document.addEventListener('DOMContentLoaded', () => {

  // --- Referencias a los elementos de la página ---
  const photoButton = document.getElementById('photo-button');
  const resultContainer = document.getElementById('result-container');
  const ticketImage = document.getElementById('ticket-image');
  const extractedTextSpan = document.getElementById('extracted-text');
  
  const dateSpan = document.getElementById('date');
  const timeSpan = document.getElementById('time');
  const amountSpan = document.getElementById('amount');
  const litersSpan = document.getElementById('liters');
  const pointOfSaleSpan = document.getElementById('point-of-sale');
  const saveButton = document.getElementById('save-button');

  // --- NUEVO: Lógica para el botón de instalación de la PWA ---
  let deferredPrompt;
  const installButton = document.getElementById('install-button');

  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    installButton.style.display = 'block';
  });

  installButton.addEventListener('click', async () => {
    if (!deferredPrompt) {
      return;
    }
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`User response to the install prompt: ${outcome}`);
    deferredPrompt = null;
    installButton.style.display = 'none';
  });

  // --- La Magia del Botón de la Foto (Versión Simple) ---
  photoButton.addEventListener('click', () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    // CAMBIO: Se elimina la línea 'input.capture' para dar opción a cámara/galería.
    // input.capture = 'environment';

    input.addEventListener('change', async (event) => {
      const file = event.target.files[0];
      if (file) {
        const imageUrl = URL.createObjectURL(file);
        ticketImage.src = imageUrl;
        resultContainer.style.display = 'block';

        extractedTextSpan.textContent = 'Leyendo el texto de la foto... por favor, espera.';
        
        dateSpan.textContent = 'No encontrado'; timeSpan.textContent = 'No encontrado';
        amountSpan.textContent = 'No encontrado'; litersSpan.textContent = 'No encontrado';
        pointOfSaleSpan.textContent = 'No encontrado'; saveButton.style.display = 'none';

        const result = await Tesseract.recognize(
          ticketImage,
          'spa',
          { logger: m => console.log(m) }
        );

        const text = result.data.text;
        extractedTextSpan.textContent = text;

        // --- LÓGICA DE BÚSQUEDA ---
        if (document.getElementById('search-pos').checked) {
          const posPattern = /(BANESCO|BANCO\s*PROVINCIAL|BANCO\s*MERCANTIL|BANCO\s*VENEZUELA|BANCO\s*CARONI|BANCO\s*DE\s*VENEZUELA)/i;
          const posMatch = text.match(posPattern);
          if (posMatch) pointOfSaleSpan.textContent = posMatch[1];
        }
        if (document.getElementById('search-date').checked) {
          const datePattern = /\b(\d{2}\/\d{2}\/\d{2,4})\b/;
          const dateMatch = text.match(datePattern);
          if (dateMatch) dateSpan.textContent = dateMatch[1];
        }
        if (document.getElementById('search-time').checked) {
          const timePattern = /\b(\d{1,2}[:\s]\d{2}(?:[:\s]\d{2})?)\s*([ap]\.?\s*m\.?)\b/i;
          const timeMatch = text.match(timePattern);
          if (timeMatch) {
            let timeString = timeMatch[1];
            timeString = timeString.replace(/\s+/g, ':');
            timeString = timeString.replace(/:$/, '');
            const ampm = timeMatch[2];
            timeSpan.textContent = `${timeString} ${ampm}`;
          }
        }
        if (document.getElementById('search-amount').checked) {
          const amountPattern = /(MONTO|TOTAL|IMPORTE|Bs\.?|\$)\s*[:$]?\s*(\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{2}))/i;
          const amountMatch = text.match(amountPattern);
          if (amountMatch) {
            let amountString = amountMatch[2];
            amountString = amountString.replace(/[.,]/, '');
            amountSpan.textContent = amountString;
          }
        }
        
        if (document.getElementById('search-liters').checked) {
          let litersFound = false;
          const litersPattern1 = /([lL]itros?)\s*(\d+[.,]\d+)/;
          const litersMatch1 = text.match(litersPattern1);
          if (litersMatch1) {
            litersSpan.textContent = litersMatch1[2].replace('.', ',');
            litersFound = true;
          } else {
            const litersPattern2 = /(\d+[.,]?\d*)\s*[lL][tT][oO]/;
            const litersMatch2 = text.match(litersPattern2);
            if (litersMatch2) {
              litersSpan.textContent = litersMatch2[1].replace('.', ',');
              litersFound = true;
            } else {
              const litersPattern3 = /(\d+)\s*[lL][tT][sS]/;
              const litersMatch3 = text.match(litersPattern3);
              if (litersMatch3) {
                litersSpan.textContent = litersMatch3[1];
                litersFound = true;
              }
            }
          }
          if (!litersFound) {
            litersSpan.textContent = 'No encontrado';
          }
        }
        saveButton.style.display = 'block';
      }
    });

    input.click();
  });

  // --- Lógica del Botón de Guardar ---
  saveButton.addEventListener('click', async () => {
    saveButton.disabled = true; saveButton.textContent = 'Guardando...';
    const ticketData = {
      pointOfSale: pointOfSaleSpan.textContent, date: dateSpan.textContent, time: timeSpan.textContent,
      liters: litersSpan.textContent, amount: amountSpan.textContent, fullText: extractedTextSpan.textContent,
      timestamp: new Date()
    };
    try {
      const docRef = await addDoc(collection(db, "tickets"), ticketData);
      console.log("Documento guardado con ID: ", docRef.id);
      alert('¡Ticket guardado en la nube con éxito!');
      resultContainer.style.display = 'none'; saveButton.style.display = 'none';
    } catch (e) {
      console.error("Error al guardar el documento: ", e);
      alert('Hubo un error al guardar. Revisa la consola.');
    } finally {
      saveButton.disabled = false; saveButton.textContent = 'Guardar en la Nube';
    }
  });

});