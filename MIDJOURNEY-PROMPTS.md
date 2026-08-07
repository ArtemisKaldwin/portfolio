# Visuels — prompts Midjourney

Le site n'a besoin d'aucune image pour fonctionner : le fond immersif (eau profonde,
puits de lumière, particules en suspension) est entièrement dessiné en canvas dans
`script.js`. Ces prompts servent à **enrichir**, pas à combler un trou.

## La palette, à copier telle quelle dans chaque prompt

```
#032633 Daintree · #101520 Corbeau · #E0D5EF Japan Blush · #C6A8C8 Tea Towel
#AC7A99 Wonder Wish · #AA5D60 Italian Villa · #733540 Catawba
```

Trois réglages à garder sur tous les prompts :

- `--style raw` — sans lui, Midjourney rajoute son vernis « joli » et casse la palette
- `--v 7`
- pas de texte dans l'image, jamais : la typographie est déjà en place dans le site

---

## 1. Portrait de remplacement · priorité

Remplace `kawtar-portrait.png` (dessin au trait noir sur fond blanc, style banque
d'images — il jurerait sur le fond bleu nuit). Objectif : une illustration au trait
faite pour ce site, à placer dans la section À propos.

```
minimal single-line-weight illustration of a woman seated at a laptop, seen in
three-quarter profile, shoulder-length dark hair, calm concentrated posture,
drawn in one continuous pale lavender line (#E0D5EF) on a deep teal background
(#032633), no fill, no shading, no face detail beyond a suggestion, generous empty
space around the figure, editorial line art, quiet and precise --ar 4:5 --style raw --v 7
```

Choisis la variante où la ligne reste **fine et régulière** : dès qu'elle s'épaissit
ou se met à varier, ça bascule dans le style « clipart » qu'on cherche justement à quitter.

## 2. Texture d'encre dans l'eau · facultatif

Pour le haut du héro, en surimpression très basse opacité derrière le nom.

```
abstract macro photograph of a single drop of rose-brown ink (#AA5D60) diffusing
in dark teal water (#032633), soft billowing tendrils, shallow depth of field,
no subject, no horizon, no reflections, pure fluid abstraction, deep shadow
occupying most of the frame --ar 16:9 --style raw --v 7
```

## 3. Pétales à la dérive · facultatif

Rejoue directement la photo dont vient la palette. Fond de section, très discret.

```
overhead photograph of pale blush magnolia petals (#E0D5EF, #C6A8C8) floating
scattered on still dark teal water (#032633), petals sparse and unevenly spread,
soft natural light, no vessel, no hands, no shoreline, matte finish, muted
--ar 3:2 --style raw --v 7
```

## 4. Fond de section abyssal · facultatif

Pour la zone Contact, tout en bas de la plongée.

```
abstract deep-water darkness, faint bioluminescent specks in pale lavender
(#E0D5EF) suspended in near-black blue (#101520), extreme negative space,
almost nothing visible, contemplative, grain --ar 21:9 --style raw --v 7
```

---

## Quand tu as les images

1. Dépose les PNG dans `assets/` du repo `portfolio`.
2. Nomme-les explicitement : `portrait.png`, `encre.png`, `petales.png`, `abysse.png`.
3. Dis-moi lesquelles tu as retenues — je les intègre (recadrage, opacité, fondu avec le
   fond de plongée, versions `srcset` pour ne pas alourdir le chargement mobile).

N'ajoute pas les images au HTML toi-même : posées telles quelles, en pleine opacité,
elles écraseront le fond animé et donneront exactement l'effet collage qu'on veut éviter.

---

## Alternative : génération par Gemini

Si tu préfères que je génère les textures directement pendant qu'on travaille :

1. Récupère une clé sur https://aistudio.google.com/apikey
2. Ajoute la ligne suivante à la fin de ton `~/.zshrc` :
   ```
   export GEMINI_API_KEY="ta-clé-ici"
   ```
3. Ouvre un nouveau terminal (ou `source ~/.zshrc`), puis dis-moi que c'est fait.

J'installerai le paquet `google-genai` et je générerai les textures avec les mêmes
prompts. Le portrait, lui, reste meilleur sur Midjourney : Gemini rend mal les
illustrations au trait continu.
