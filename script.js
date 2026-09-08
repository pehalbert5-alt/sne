const menuButton = document.getElementById("menuButton");
const nav = document.getElementById("nav");


// ==============================
// MENU MOBILE
// ==============================

if (menuButton && nav) {

    menuButton.addEventListener("click", () => {

        nav.classList.toggle("active");

        if (nav.classList.contains("active")) {
            menuButton.textContent = "✕";
        } else {
            menuButton.textContent = "☰";
        }

    });


    // Fermer le menu après un clic
    nav.querySelectorAll("a").forEach(link => {

        link.addEventListener("click", () => {

            nav.classList.remove("active");

            menuButton.textContent = "☰";

        });

    });

}


// ==============================
// ANIMATION AU SCROLL
// ==============================

const animatedElements = document.querySelectorAll(
    ".service-card, .contact-card, .about-content, .about-image"
);

const observer = new IntersectionObserver(
    entries => {

        entries.forEach(entry => {

            if (entry.isIntersecting) {

                entry.target.classList.add("show");

            }

        });

    },
    {
        threshold: 0.15
    }
);


animatedElements.forEach(element => {

    element.classList.add("hidden");

    observer.observe(element);

});


// ==============================
// MESSAGE CONSOLE
// ==============================

console.log(
    "SNE — Site web chargé avec succès."
);


// ==============================
// SYSTÈME DE BIENVENUE
// ==============================

const welcomeScreen =
    document.getElementById("welcome-screen");

const welcomeNext =
    document.getElementById("welcome-next");


// Pour le moment :
// false = visiteur non connecté
// true  = utilisateur connecté

const isLoggedIn = false;


// Si l'utilisateur n'est PAS connecté
if (!isLoggedIn) {

    if (welcomeScreen) {
        welcomeScreen.style.display = "flex";
    }

}


// Si l'utilisateur est connecté
else {

    if (welcomeScreen) {

        welcomeScreen.remove();

    }

}


// Bouton "Suivant"

if (welcomeNext && welcomeScreen) {

    welcomeNext.addEventListener("click", () => {

        welcomeScreen.classList.add("hide");

        setTimeout(() => {

            welcomeScreen.remove();

        }, 700);

    });

}

/* ==============================
   BIENVENUE SNE
============================== */

document.addEventListener("DOMContentLoaded", () => {

    const welcomeScreen = document.getElementById("welcome-screen");
    const welcomeContact = document.getElementById("welcome-contact");

    /*
       Pour le moment :
       false = visiteur non connecté
       true  = utilisateur connecté

       Plus tard, cette valeur pourra venir
       du système de connexion.
    */
    const isLoggedIn = false;

    if (isLoggedIn) {
        if (welcomeScreen) {
            welcomeScreen.remove();
        }
        return;
    }

    if (welcomeContact && welcomeScreen) {

        welcomeContact.addEventListener("click", () => {

            welcomeScreen.classList.add("hide");

            setTimeout(() => {
                welcomeScreen.remove();

                const contactSection =
                    document.getElementById("contact");

                if (contactSection) {
                    contactSection.scrollIntoView({
                        behavior: "smooth"
                    });
                }

            }, 600);

        });

    }

});
