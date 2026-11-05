------------------------------------------------------------------------------------------------------
🎯 ATELIER RENDER
------------------------------------------------------------------------------------------------------
L’idée en 30 secondes : Dans cet atelier, vous allez construire une **chaîne DevOps complète de bout en bout**. À partir d’une **application Flask**, vous allez **créer une image Docker**, la publier dans un registre, puis **automatiser son déploiement dans le cloud** avec **GitHub Actions** et utiliser **Terraform pour créer un service Render**. L’objectif est de comprendre comment passer du code à une application accessible en ligne, de manière industrielle, reproductible et sans intervention manuelle. À la fin, chacun de vous aura sa propre application déployée en production.
  
**Architecture cible :** Ci-dessous, voici l'architecture cible souhaitée.   
<img width="1536" height="1024" alt="image" src="https://github.com/user-attachments/assets/e06361ad-18fd-403f-b642-d021d2a46f62" />

-------------------------------------------------------------------------------------------------------
🧩 Séquence 1 : Github
-------------------------------------------------------------------------------------------------------
Objectif : Forker le projet  
Difficulté : Très facile (~5 minutes)
-------------------------------------------------------------------------------------------------------
**Faites un Fork de ce projet**. Si besoin, voici une vidéo d'accompagnement pour vous aider à "Forker" un Repository Github : [Forker ce projet](https://youtu.be/p33-7XQ29zQ) 
   
---------------------------------------------------
🧩 Séquence 2 : Création d'un compte Render
---------------------------------------------------
Objectif : Créer un hébergement sur Render  
Difficulté : Faible (~10 minutes)
---------------------------------------------------

Rendez-vous sur **https://render.com** et créez vous un compte.  
  
---------------------------------------------------------------------------------------------
🧩 Séquence 3 : Les Actions GitHUB (Industrialisation Continue)
---------------------------------------------------------------------------------------------
Objectif : Automatiser la mise à jour de vos Web Service Render  
Difficulté : Moyenne (~15 minutes)
---------------------------------------------------------------------------------------------
Dans le Repository GitHUB que vous venez de créer précédemment lors de la séquence 1, vous avez un fichier intitulé **deploy.yml** et qui est déposé dans le répertoire .github/workflows. Ce fichier a pour objectif d'automatiser le déploiement de votre code sur votre site Render. Pour information, c'est ce que l'on appel des Actions GitHUB. Ce sont des scripts qui s'exécutent automatiquement lors de chaque Commit dans votre projet (C'est à dire à chaque modification de votre code). Ces scripts (appelés actions) sont au format yml qui est un format structuré proche de celui d'XML.  

Pour utiliser cette Action (deploy.yml), **vous avez besoin de créer des secrets dans GitHUB** afin de ne pas divulguer des informations sensibles aux internautes de passage dans votre Repository comme vos login et password par exemple.  

Pour cet atelier, **vous avez 2 secrets à créer** dans votre Repository GitHUB : **Settings → Secrets and variables → Actions → New repository secret**  
  
**RENDER_API_KEY** = API KEY à créer depuis Render : **Acount setting (en haut à droite)  → API Keys → Create API Key**   
**RENDER_OWNER_ID** = Que vous trouverez dans votre Workspace settings Render (en haut à gauche), ex d'ID : tea-d6jcjo7kijhs739elfd0.   
  
**Dernière étape :** Pour engager l'automatisation de votre première Action, vous devez cliquer sur le gros boutton vert dans l'onglet supérieur [Actions] dans votre Repository Github. Le boutton s'intitule [I understand my workflows, go ahead and enable them].   

Notions acquises de cette séquence :  
Vous avez vu dans cette séquence comment créer des secrets GiHUB afin de mettre en place de l'industrialisation continue.   

---------------------------------------------------
🗺️ Séquence 4 : Mise en service
---------------------------------------------------
Objectif : Déployer votre service web Render  
Difficulté : Faible (~10 minutes)
---------------------------------------------------
Procédez à la modification de ce README.md (ex: Mon NOM Prénom ici) et Commitez. La création du Service Web Render est automatique.  

<img width="2150" height="616" alt="image" src="https://github.com/user-attachments/assets/7254a9c4-1bc7-4338-b25e-cad8259d396b" />  

Vous pouvez cliquez sur votre URL est observez le résultat.  
  
<img width="2048" height="224" alt="image" src="https://github.com/user-attachments/assets/fd03a614-93b6-4416-869c-f8a737b272e2" />

### Explication de votre environnement Render 
* Une image Docker déposée dans GHCR (espace de stockage des images Docker de GitHUb) est utilisée par Render pour créer un Web Service, qui exécute alors un container et expose une application via une URL publique.
* Il ne peut y avoir qu'un container par Web Service. Si vous souhaitez lancer plusieurs Docker, il faudra alors créer plusieurs Web Service.
* Vous pouvez créer autant de Web Service que vous souhaitez mais le cumul d'utilisation autorisé pour le compte Free est de maximum 750h par mois. **Pensez à la fin de vos ateliers à mettre en pause vos Web Service**.  
  
---------------------------------------------------
✅ Séquence 4 : Exercices  
Difficulté : Facile (~30 minutes)
---------------------------------------------------
### Exercice 1  
Ajouter une nouvelle route dans votre application.

```
@app.route("/info")
def info():
    return {
        "app": "Flask Render",
        "student": "VOTRE_NOM",
        "version": "v1"
    }
```
### Exercice 2    
Injecter une variable d'environnement dans Render via Terraform.
1° - Modifier le main.tf de Terraform  
```
env_vars = {
  ENV = {
    value = "production"
  }
}
```
2° - Et dans votre application Flask ajoutez la route suivante  
```
@app.route("/env")
def env():
    return {"env": os.getenv("ENV")}
```
Observation : Terraform a bien injecter une variable d'environnement dans Render et vous êtes en mesure de pouvoir l'utiliser (ex : affichage).  

---------------------------------------------------
✅ Séquence 5 : Atelier  
Difficulté : Moyenne (~1h30 heure)
---------------------------------------------------
### React -> Flask -> PostgreSQL -> Adminer  
Vous allez créer un environnement de développement qui proposera aux développeur les outils suivants : React pour le front, Flask pour le backend, PPostgreSQL pour le BDD et Adminer pour gérer la BDD.  

**Achitecture cible** est la suivante :  
  
<img width="1536" height="1024" alt="image" src="https://github.com/user-attachments/assets/b5611e31-78d3-402b-9d36-7589784f1dd7" />  
  
* **Flask** : Créé via Terraform comme **Web Service**
* **Adminer** : Créé via Terraform comme **Web Service**
* **React** : A créer directement dans Render via l’interface **New -> Static Site -> Public Git Repository** 
* **PostgreSQL** : A créer directement dans Render comme **Managed Database**

**Indices N°1 :** La structure mininale pour faire fonctionner React est la suivante
```
frontend/
├── package.json
├── public/
│   └── index.html
└── src/
    └── index.js
```
**Indices N°2 :** Le répertoire racine de votre React (frontend) est à renseigner dans le champ **Root Directory** dans Render lors de la création de votre **Static Site**  

---------------------------------------------------
Evaluation
---------------------------------------------------
Cet atelier Render, **noté sur 20 points**, est évalué sur la base du barème suivant :  
- Mise en service (4 points)
- Exerice 1 - Nouvelle route (2 points)
- Exerice 2 - Modification de Terraform (2 points)
- Atelier - Plateforme de développement (9 points)
- Processus travail (quantité de commits, cohérence globale, interventions externes, ...) (3 points) 
