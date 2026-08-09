# Note d'intention

Ce dépôt contient le portfolio de Kawtar Belkacemi, data analyst.
En ligne : **[artemiskaldwin.github.io/portfolio](https://artemiskaldwin.github.io/portfolio/)**

Ce texte explique pourquoi le site ressemble à ça. Il n'y avait pas de brief, pas de
charte à respecter : le parti pris est assumé, autant l'écrire.

## La descente

Il y a deux ans, j'étais à la surface de la data. Je savais me servir d'Excel. Aujourd'hui
je travaille sur des méthodes de machine learning et je cherche à aller plus loin.
Entre les deux, il n'y a pas eu de saut — il y a eu une descente, lente, avec des paliers.

Le site est construit comme cette descente. On entre à la surface, à zéro mètre, et chaque
section descend d'un cran : thermocline, limite photique, zone crépusculaire, mésopélagique,
bathyal, abysse. Le compteur de profondeur à gauche n'est pas un ornement, c'est la table
des matières.

Trois choses descendent en même temps, et c'est leur superposition qui fait la direction
artistique plutôt qu'une ambiance marine plaquée :

**Ma trajectoire.** Excel en haut, machine learning en bas. L'outil de surface est
d'ailleurs listé dans le premier écran, avec les autres.

**Mon métier.** Vers deux cents mètres, la lumière cesse de suffire à la photosynthèse.
Au-dessus, on voit. En dessous, il faut des instruments. C'est exactement ce qui se passe
en analyse de données : passé un certain volume, l'œil ne suffit plus — une carte de
chaleur qu'on lit du regard — et il faut des tests, des modèles, de la mesure.

**La vérifiabilité.** Plus on descend, plus c'est vérifiable. En haut, une promesse en une
phrase. En bas, du code qu'on peut relancer. C'est l'inverse du portfolio habituel, qui
place sa plus grosse affirmation en premier et devient vague ensuite.

## Ce qui est en bas n'est pas vide

C'est le point qui m'importe le plus. Dans le projet Bottleneck, deux méthodes de détection
multivariée font apparaître trente-huit articles anormaux que l'analyse d'origine ne voyait
pas. Ces articles étaient déjà là. Rien n'a été créé — quelque chose a été éclairé.

Les abysses sont la meilleure image que j'aie trouvée pour ça : ce n'est pas vide, c'est
seulement non éclairé.

## La lumière vient de ce qui vit là

Les puits de lumière du fond s'éteignent à mesure qu'on descend, parce que la lumière du
jour ne franchit pas la zone photique. En dessous, il reste des points lumineux qui, eux,
gagnent en présence : de la bioluminescence. À ces profondeurs, la seule lumière est
produite par les organismes eux-mêmes.

Lu comme il faut : la preuve s'éclaire elle-même. Elle n'attend pas de validation extérieure.

## Ce que le site refuse

Le bleu et le blanc, les grands aplats clairs, le tableau de bord d'entreprise. Mon
quotidien passe beaucoup par Power BI et j'y tiens, mais un portfolio qui ressemble à un
rapport hebdomadaire ne dit rien de ce que je sais faire d'autre. Le fond sombre est une
position, pas une préférence esthétique.

## Notes techniques

- Aucun framework, aucune étape de build. HTML, CSS, JavaScript.
- Le fond immersif — eau profonde, puits de lumière, bioluminescence — est **entièrement
  dessiné en canvas**. Le site ne charge aucune image de décor.
- Les sprites lumineux sont pré-rendus une fois ; les puits de lumière sont pré-rendus par
  redimensionnement, flou compris. Rien de coûteux ne tourne à chaque image.
- Switzer et JetBrains Mono sont servies depuis le dépôt ; Archivo vient de Google Fonts,
  seule ressource externe du site.
- `prefers-reduced-motion` fige le fond sur une seule image et désactive les apparitions
  au défilement.
- Le code des projets présentés vit dans un dépôt séparé :
  [data-analyst-projects](https://github.com/ArtemisKaldwin/data-analyst-projects).

Pour le lancer en local, n'importe quel serveur statique suffit :

```bash
python3 -m http.server 8000
```
