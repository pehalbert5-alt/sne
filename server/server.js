require("dotenv").config({ path: __dirname + "/.env" });

const express = require("express");
const cors = require("cors");
const Database = require("better-sqlite3");
const { OAuth2Client } = require("google-auth-library");

const app = express();

const PORT = process.env.PORT || 3000;
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;

if (!GOOGLE_CLIENT_ID) {
    console.error("❌ GOOGLE_CLIENT_ID manquant dans server/.env");
    process.exit(1);
}

/* ========================================
   BASE DE DONNÉES
======================================== */

const db = new Database("./sne.db");

db.pragma("journal_mode = WAL");

db.exec(`
    CREATE TABLE IF NOT EXISTS accounts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        google_id TEXT NOT NULL UNIQUE,
        name TEXT NOT NULL,
        email TEXT NOT NULL,
        picture TEXT DEFAULT '',
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
    )
`);

console.log("✅ Base de données SNE connectée");

/*
========================================
 DEMANDES DE SERVICES
========================================
*/

db.exec(`
    CREATE TABLE IF NOT EXISTS service_requests (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        google_id TEXT NOT NULL,
        service TEXT NOT NULL,
        date TEXT NOT NULL,
        time TEXT NOT NULL,
        surface INTEGER,
        rooms INTEGER,
        message TEXT DEFAULT '',
        status TEXT NOT NULL DEFAULT 'En attente',
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
    )
`);


/* ========================================
   GOOGLE
======================================== */

const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);

/* ========================================
   EXPRESS
======================================== */

app.use(cors({
    origin: [
        "http://localhost:8080",
        "http://127.0.0.1:8080",
        "https://pehalbert5-alt.github.io"
    ]
}));

app.use(express.json({
    limit: "10mb"
}));

/* ========================================
   HEALTH
======================================== */

app.get("/api/health", (req, res) => {

    res.json({
        success: true,
        service: "SNE SERVICES API",
        status: "online",
        database: "connected",
        google: "active"
    });

});

/* ========================================
   CONNEXION GOOGLE
======================================== */

app.post("/api/auth/google", async (req, res) => {

    try {

        const {
            credential,
            name: typedName
        } = req.body;

        if (!credential) {

            return res.status(400).json({
                success: false,
                message: "Credential Google manquante"
            });

        }

        const ticket =
            await googleClient.verifyIdToken({
                idToken: credential,
                audience: GOOGLE_CLIENT_ID
            });

        const payload =
            ticket.getPayload();

        if (!payload || !payload.sub) {

            return res.status(401).json({
                success: false,
                message: "Compte Google invalide"
            });

        }

        const googleId = payload.sub;

        const googleName =
            payload.name || "";

        const googleEmail =
            payload.email || "";

        const googlePicture =
            payload.picture || "";

        /* ========================================
           RECHERCHER LE COMPTE
        ======================================== */

        let account =
            db.prepare(`
                SELECT
                    id,
                    google_id AS googleId,
                    name,
                    email,
                    picture,
                    created_at AS createdAt,
                    updated_at AS updatedAt
                FROM accounts
                WHERE google_id = ?
            `).get(googleId);

        /* ========================================
           NOUVEAU COMPTE
        ======================================== */

        if (!account) {

            const finalName =
                typedName &&
                String(typedName).trim()
                    ? String(typedName).trim()
                    : googleName || "Utilisateur SNE";

            const now =
                new Date().toISOString();

            const result =
                db.prepare(`
                    INSERT INTO accounts (
                        google_id,
                        name,
                        email,
                        picture,
                        created_at,
                        updated_at
                    )
                    VALUES (?, ?, ?, ?, ?, ?)
                `).run(
                    googleId,
                    finalName,
                    googleEmail,
                    googlePicture,
                    now,
                    now
                );

            account =
                db.prepare(`
                    SELECT
                        id,
                        google_id AS googleId,
                        name,
                        email,
                        picture,
                        created_at AS createdAt,
                        updated_at AS updatedAt
                    FROM accounts
                    WHERE id = ?
                `).get(result.lastInsertRowid);

            console.log("");
            console.log("======================================");
            console.log("🆕 NOUVEAU COMPTE SNE");
            console.log("Nom :", account.name);
            console.log("Email :", account.email);
            console.log("Google ID :", account.googleId);
            console.log("======================================");
            console.log("");

        }

        /* ========================================
           COMPTE EXISTANT
        ======================================== */

        else {

            /*
             * On conserve le nom et la photo
             * personnalisés par l'utilisateur.
             */

            const now =
                new Date().toISOString();

            db.prepare(`
                UPDATE accounts
                SET
                    email = ?,
                    updated_at = ?
                WHERE google_id = ?
            `).run(
                googleEmail,
                now,
                googleId
            );

            account =
                db.prepare(`
                    SELECT
                        id,
                        google_id AS googleId,
                        name,
                        email,
                        picture,
                        created_at AS createdAt,
                        updated_at AS updatedAt
                    FROM accounts
                    WHERE google_id = ?
                `).get(googleId);

            console.log("");
            console.log("======================================");
            console.log("🔵 COMPTE SNE RETROUVÉ");
            console.log("Nom :", account.name);
            console.log("Email :", account.email);
            console.log("Google ID :", account.googleId);
            console.log("======================================");
            console.log("");
        }

        return res.json({
            success: true,
            message: "Connexion Google réussie",
            user: account
        });

    } catch (error) {

        console.error("");
        console.error("❌ ERREUR GOOGLE");
        console.error(error.message);
        console.error("");

        return res.status(401).json({
            success: false,
            message: "Authentification Google invalide"
        });

    }

});

/* ========================================
   RÉCUPÉRER UN COMPTE
======================================== */

app.get("/api/account/:googleId", (req, res) => {

    try {

        const googleId =
            req.params.googleId;

        const account =
            db.prepare(`
                SELECT
                    id,
                    google_id AS googleId,
                    name,
                    email,
                    picture,
                    created_at AS createdAt,
                    updated_at AS updatedAt
                FROM accounts
                WHERE google_id = ?
            `).get(googleId);

        if (!account) {

            return res.status(404).json({
                success: false,
                message: "Compte SNE introuvable"
            });

        }

        return res.json({
            success: true,
            user: account
        });

    } catch (error) {

        console.error(
            "❌ Erreur récupération compte :",
            error.message
        );

        return res.status(500).json({
            success: false,
            message: "Impossible de récupérer le compte"
        });

    }

});

/* ========================================
   MODIFIER LE PROFIL
======================================== */

app.put("/api/account/:googleId", (req, res) => {

    try {

        const googleId =
            req.params.googleId;

        const {
            name,
            picture
        } = req.body;

        if (!name || !String(name).trim()) {

            return res.status(400).json({
                success: false,
                message: "Le nom est requis"
            });

        }

        const existing =
            db.prepare(`
                SELECT *
                FROM accounts
                WHERE google_id = ?
            `).get(googleId);

        if (!existing) {

            return res.status(404).json({
                success: false,
                message: "Compte SNE introuvable"
            });

        }

        const finalPicture =
            picture &&
            String(picture).trim()
                ? picture
                : existing.picture || "";

        const updatedAt =
            new Date().toISOString();

        db.prepare(`
            UPDATE accounts
            SET
                name = ?,
                picture = ?,
                updated_at = ?
            WHERE google_id = ?
        `).run(
            String(name).trim(),
            finalPicture,
            updatedAt,
            googleId
        );

        const account =
            db.prepare(`
                SELECT
                    id,
                    google_id AS googleId,
                    name,
                    email,
                    picture,
                    created_at AS createdAt,
                    updated_at AS updatedAt
                FROM accounts
                WHERE google_id = ?
            `).get(googleId);

        console.log("");
        console.log("======================================");
        console.log("✅ PROFIL SNE MODIFIÉ");
        console.log("Nom :", account.name);
        console.log("Email :", account.email);
        console.log("======================================");
        console.log("");

        return res.json({
            success: true,
            message: "Profil mis à jour",
            user: account
        });

    } catch (error) {

        console.error("");
        console.error("❌ ERREUR MODIFICATION PROFIL");
        console.error(error.message);
        console.error("");

        return res.status(500).json({
            success: false,
            message: "Impossible de modifier le profil"
        });

    }

});

/* ========================================
   LISTE DES COMPTES
======================================== */

app.get("/api/accounts", (req, res) => {

    try {

        const accounts =
            db.prepare(`
                SELECT
                    id,
                    google_id AS googleId,
                    name,
                    email,
                    picture,
                    created_at AS createdAt,
                    updated_at AS updatedAt
                FROM accounts
                ORDER BY id DESC
            `).all();

        return res.json({
            success: true,
            count: accounts.length,
            accounts
        });

    } catch (error) {

        console.error(
            "❌ Erreur comptes :",
            error.message
        );

        return res.status(500).json({
            success: false,
            message: "Impossible de récupérer les comptes"
        });

    }

});


/*
========================================
 CRÉER UNE DEMANDE DE SERVICE
========================================
*/

app.post("/api/service-requests", (req, res) => {

    try {

        const {
            googleId,
            service,
            surface,
            rooms,
            message
        } = req.body;

        if (!googleId) {

            return res.status(401).json({
                success: false,
                message: "Compte SNE requis"
            });

        }

        if (!service) {

            return res.status(400).json({
                success: false,
                message: "Le service est requis"
            });

        }

        const account =
            db.prepare(`
                SELECT *
                FROM accounts
                WHERE google_id = ?
            `).get(googleId);

        if (!account) {

            return res.status(404).json({
                success: false,
                message: "Compte SNE introuvable"
            });

        }

        const now =
            new Date().toISOString();

        const result =
            db.prepare(`
                INSERT INTO service_requests (
                    google_id,
                    service,
                    surface,
                    rooms,
                    message,
                    status,
                    created_at,
                    updated_at
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `).run(
                googleId,
                service,
                surface || null,
                rooms || null,
                message || "",
                "En attente",
                now,
                now
            );

        console.log("");
        console.log("======================================");
        console.log("🆕 NOUVELLE DEMANDE SNE");
        console.log("Client :", account.name);
        console.log("Email :", account.email);
        console.log("Service :", service);
        console.log("Lieu :", message || "Non renseigné");
        console.log("ID :", result.lastInsertRowid);
        console.log("======================================");
        console.log("");

        return res.json({
            success: true,
            message: "Demande envoyée",
            request: {
                id: result.lastInsertRowid,
                service,
                surface: surface || null,
                rooms: rooms || null,
                message: message || "",
                status: "En attente",
                createdAt: now
            }
        });

    } catch (error) {

        console.error(
            "❌ Erreur demande service :",
            error.message
        );

        return res.status(500).json({
            success: false,
            message: "Impossible d'enregistrer la demande"
        });

    }

});


/*
========================================
 MES DEMANDES
========================================
*/

app.get("/api/service-requests/:googleId", (req, res) => {

    try {

        const googleId =
            req.params.googleId;

        const requests =
            db.prepare(`
                SELECT
                    id,
                    service,
                    date,
                    time,
                    surface,
                    rooms,
                    message,
                    status,
                    created_at AS createdAt,
                    updated_at AS updatedAt
                FROM service_requests
                WHERE google_id = ?
                ORDER BY id DESC
            `).all(googleId);

        return res.json({
            success: true,
            requests
        });

    } catch (error) {

        console.error(
            "❌ Erreur demandes :",
            error.message
        );

        return res.status(500).json({
            success: false,
            message: "Impossible de récupérer les demandes"
        });

    }

});


/* ========================================
   SERVEUR
======================================== */

app.listen(PORT, () => {

    console.log("");
    console.log("======================================");
    console.log("        SNE SERVICES API");
    console.log("======================================");
    console.log(`Serveur : http://localhost:${PORT}`);
    console.log("Google : actif");
    console.log("Compte réel : actif");
    console.log("Téléphone : désactivé");
    console.log("OTP : désactivé");
    console.log("WhatsApp : désactivé");
    console.log("Localisation : désactivée");
    console.log("Base de données : sne.db");
    console.log("======================================");
    console.log("");

});
