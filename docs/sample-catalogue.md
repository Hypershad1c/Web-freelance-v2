# Catalogue d’exemple Domify

Les douze fiches prévues dans ce catalogue sont des **annonces d’exemple**. Elles sont conçues pour démontrer la recherche, la carte, le calcul de financement, la comparaison et les parcours multilingues de Domify. Elles ne représentent pas des biens disponibles à la vente ou à la location et portent systématiquement un préfixe explicite dans leurs titres français, anglais et arabes.

| Référence | Ville | Quartier | Type | Transaction | Prix illustratif (MAD) | Image locale |
|---|---|---|---|---|---:|---|
| DEMO-CAS-001 | Casablanca | Racine | Appartement | Vente | 2 850 000 | `casablanca-loft.jpg` |
| DEMO-CAS-002 | Casablanca | Maarif | Appartement | Location | 17 500/mois | `casablanca-city.jpg` |
| DEMO-CAS-003 | Bouskoura | Ville Verte | Villa | Vente | 6 900 000 | `casablanca-villa.jpg` |
| DEMO-RAB-001 | Rabat | Hay Riad | Appartement | Vente | 3 650 000 | `rabat-residence.jpg` |
| DEMO-RAB-002 | Rabat | Souissi | Villa | Vente | 8 400 000 | `rabat-villa.jpg` |
| DEMO-RAB-003 | Rabat | Hay Riad | Duplex | Location | 24 000/mois | `rabat-hassan.jpg` |
| DEMO-MAR-001 | Marrakech | Médina | Riad | Vente | 4 950 000 | `marrakech-riad.jpg` |
| DEMO-MAR-002 | Marrakech | Hivernage | Appartement | Location | 15 000/mois | `marrakech-apartment.jpg` |
| DEMO-TNG-001 | Tanger | Malabata | Appartement | Vente | 3 250 000 | `tangier-bay.jpg` |
| DEMO-TNG-002 | Tanger | Kasbah | Riad | Vente | 3 980 000 | `tangier-coast.jpg` |
| DEMO-AGA-001 | Agadir | Founty | Appartement | Vente | 2 150 000 | `tangier-panoramic.jpg` |
| DEMO-AGA-002 | Agadir | Marina | Villa | Location | 28 000/mois | `rabat-medina.jpg` |

## Images

Les images ont été sélectionnées depuis des résultats **Unsplash** de recherche d’images, puis optimisées pour le web à une dimension maximale de 1 600 px et une qualité JPEG progressive de 82. La licence Unsplash autorise l’utilisation gratuite des images à des fins commerciales et non commerciales, sous réserve de ses restrictions, notamment l’interdiction de vendre les images sans modification significative et de constituer un service concurrent à partir d’une collection d’images.[1]

Les fichiers sont stockés sous `public/sample-listings/` uniquement pour les annonces d’exemple approuvées. Les URL individuelles des pages de photographes n’ont pas été conservées au moment de la sélection ; elles doivent être enregistrées avant tout usage au-delà de cette démonstration de catalogue. Avant de présenter tout bien comme une annonce réelle, Domify doit disposer des droits d’image applicables et de la validation du propriétaire ou de l’agence.

## Traçabilité de publication

Le catalogue a été créé depuis le back-office protégé le 27 août 2026. L’import a créé onze fiches et a mis à jour la première fiche créée par le formulaire ; les douze références `DEMO-…` sont publiées avec un statut d’approbation administratif. Aucune fiche existante ne portant une référence autre que `DEMO-…` n’a été incluse dans l’import.

## Validation réalisée

La recherche publique par référence `DEMO-` retourne exactement **12 résultats**. Le filtre public de location retourne les quatre annonces d’exemple concernées. Les douze fiches sont visibles dans la recherche cartographique avec leurs coordonnées illustratives, et les douze fichiers image locaux répondent avec le statut HTTP `200`.

Une fiche représentative a été contrôlée sur sa page de détail en français et en arabe : le badge localisé et l’avertissement explicite indiquant le caractère illustratif, non transactionnel du bien sont visibles dans les deux langues. La réponse serveur de cette même fiche comporte également la directive `noindex, follow`, afin de ne pas traiter ce contenu d’exemple comme un inventaire réel par les moteurs de recherche.

## Références

[1] [Unsplash, « License »](https://unsplash.com/license)
