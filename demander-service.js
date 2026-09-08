const API_URL = "http://localhost:3000";

let currentUser = null;


/* ========================================
   AFFICHER UN MESSAGE
======================================== */

function showMessage(message, type) {

    const box =
        document.getElementById("formMessage");

    box.textContent = message;

    box.className =
        "form-message " + type;

}


/* ========================================
   CHARGER LE COMPTE
======================================== */

function loadAccount() {

    const savedUser =
        localStorage.getItem("sne_user");

    if (!savedUser) {

        showMessage(
            "Vous devez vous connecter à votre compte SNE avant de faire une demande.",
            "error"
        );

        document.getElementById("submitButton").disabled = true;

        return;
    }

    try {

        currentUser =
            JSON.parse(savedUser);

        document.getElementById("accountName")
            .textContent =
            "Nom : " +
            (currentUser.name || "Non renseigné");

        document.getElementById("accountEmail")
            .textContent =
            "Email : " +
            (currentUser.email || "Non renseigné");

    } catch (error) {

        console.error(error);

        showMessage(
            "Impossible de charger votre compte.",
            "error"
        );

    }

}


/* ========================================
   DATE MINIMUM = AUJOURD'HUI
======================================== */

function setMinimumDate() {

    const dateInput =
        document.getElementById("date");

    const today =
        new Date();

    const year =
        today.getFullYear();

    const month =
        String(today.getMonth() + 1)
            .padStart(2, "0");

    const day =
        String(today.getDate())
            .padStart(2, "0");

    dateInput.min =
        `${year}-${month}-${day}`;

}


/* ========================================
   ENVOYER LA DEMANDE
======================================== */

async function submitRequest(event) {

    event.preventDefault();

    if (!currentUser) {

        showMessage(
            "Connectez-vous à votre compte SNE.",
            "error"
        );

        return;
    }

    const service =
        document.getElementById("service").value;

    const date =
        document.getElementById("date").value;

    const time =
        document.getElementById("time").value;

    const surface =
        document.getElementById("surface").value;

    const rooms =
        document.getElementById("rooms").value;

    const message =
        document.getElementById("message").value;

    if (!service || !date || !time) {

        showMessage(
            "Veuillez remplir le service, la date et l'heure.",
            "error"
        );

        return;
    }

    const button =
        document.getElementById("submitButton");

    button.disabled = true;

    button.textContent =
        "Envoi en cours...";

    try {

        const response =
            await fetch(
                `${API_URL}/api/service-requests`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type": "application/json"
                    },

                    body: JSON.stringify({

                        googleId:
                            currentUser.googleId,

                        service,

                        date,

                        time,

                        surface:
                            surface
                                ? Number(surface)
                                : null,

                        rooms:
                            rooms
                                ? Number(rooms)
                                : null,

                        message

                    })
                }
            );

        const data =
            await response.json();

        if (!response.ok || !data.success) {

            throw new Error(
                data.message ||
                "Impossible d'envoyer la demande"
            );

        }

        showMessage(
            "✅ Votre demande a bien été envoyée à SNE.",
            "success"
        );

        document
            .getElementById("serviceRequestForm")
            .reset();

        setMinimumDate();

    } catch (error) {

        console.error(error);

        showMessage(
            error.message ||
            "Une erreur est survenue.",
            "error"
        );

    } finally {

        button.disabled = false;

        button.textContent =
            "Envoyer ma demande";

    }

}


/* ========================================
   INITIALISATION
======================================== */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        loadAccount();

        setMinimumDate();

        document
            .getElementById("serviceRequestForm")
            .addEventListener(
                "submit",
                submitRequest
            );

    }
);
