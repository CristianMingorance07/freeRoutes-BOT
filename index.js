const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion } = require('@adiwajshing/baileys');
const path = require('path');
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState(path.join(__dirname, 'auth_data')); // Carpeta donde se guardarán las credenciales

    const version = [2, 2244, 6];
    console.log(`Usando versión de WhatsApp Web: ${version}`);

    const sock = makeWASocket({
        version,
        auth: state,
        printQRInTerminal: true,
    });

    sock.ev.on('creds.update', saveCreds); // Guarda las credenciales cuando se actualicen

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update;

        if (connection === 'close') {
            const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
            if (shouldReconnect) {
                console.log('Reconectando...');
                startBot();
            } else {
                console.log('Sesión cerrada. Por favor, vuelve a escanear el QR.');
            }
        } else if (connection === 'open') {
            console.log('Conexión establecida.');
        }
    });

    sock.ev.on('messages.upsert', async ({ messages }) => {
        const msg = messages[0];
        if (!msg.key.remoteJid.endsWith('@g.us')) return;

        // Mensaje de bienvenida para nuevos miembros del grupo
        if (msg.message.conversation && msg.message.conversation.includes('se unió al grupo')) {
            const groupJid = msg.key.remoteJid;
            const sender = msg.key.participant;
            const welcomeMessage = `¡Bienvenido/a ${sender.split('@')[0]}! 🎉 Somos Free Routes, una comunidad de moteros. 🚀 Consulta nuestras normas aquí: [enlace].`;
            await sock.sendMessage(groupJid, { text: welcomeMessage });
        }
    });
}

startBot();
