// 1. GESTIONE DI LOGICA INTERATTIVA E FORM DINAMICO
    const ritualButtons = document.querySelectorAll('.btn-ritual-action, .btn-luxury');
    const formSubtitle = document.getElementById('form-feedback-text');
    const hiddenInput = document.getElementById('selected_ritual');
    const contactSection = document.getElementById('contatti');

    ritualButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            // Se il bottone ha un rituale specifico configurato
            const chosenRitual = button.getAttribute('data-ritual');
            
            if (chosenRitual) {
                // Cambia dinamicamente il sottotitolo per coccolare il cliente
                formSubtitle.innerHTML = `Hai selezionato il percorso esclusivo: <strong style="color: #D4AF37; font-family: 'Playfair Display', serif; font-size: 1.2rem;">${chosenRitual}</strong>.<br>Lascia i tuoi contatti per concordare i dettagli del tuo appuntamento privato.`;
                
                // Aggiorna il valore dell'input nascosto che andrà memorizzato nel DB (Postgres/Java)
                hiddenInput.value = chosenRitual;
            } else {
                // Se è il tasto della Hero generico
                formSubtitle.innerHTML = "Seleziona uno dei nostri rituali o richiedi una consulenza introduttiva personalizzata. Gaia ti ricontatterà per concordare il momento perfetto per te.";
                hiddenInput.value = "Consulenza Introduttiva Generica";
            }
        });
    });

    // 2. SIMULAZIONE DI INVIO DEL FORM (PRONTO PER IL FUTURO BACKEND IN JAVA)
    const bookingForm = document.getElementById('luxury-booking-form');
    
    bookingForm.addEventListener('submit', (e) => {
        e.preventDefault(); // Evita il ricaricamento immediato della pagina
        
        // Estrazione dei dati (utili per il debug attuale e futura fetch API)
        const formData = {
            ritual: hiddenInput.value,
            clientName: document.getElementById('fullname').value,
            clientPhone: document.getElementById('phone').value,
            clientNotes: document.getElementById('notes').value
        };

        console.log("Dati pronti per il backend Java/PostgreSQL:", formData);

        // Feedback visivo immediato di classe ed eleganza
        bookingForm.innerHTML = `
            <div style="text-align: center; padding: 40px 10px;">
                <i class="fa-solid fa-circle-check" style="font-size: 3.5rem; color: #D4AF37; margin-bottom: 20px;"></i>
                <h3 style="font-family: 'Playfair Display', serif; font-size: 1.8rem; margin-bottom: 15px;">Richiesta Ricevuta con Successo</h3>
                <p style="color: #6E6E6E; font-weight: 300; max-width: 500px; margin: 0 auto;">
                    Il tuo momento di totale relax è quasi pronto. Gaia esaminerà personalmente la tua richiesta per il <strong>${formData.ritual}</strong> e ti contatterà sul numero <strong>${formData.clientPhone}</strong> nelle prossime ore.
                </p>
            </div>
        `;
    });