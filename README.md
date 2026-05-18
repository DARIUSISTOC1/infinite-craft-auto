# Infinite Craft — Auto-Craft UI

Un script de console pour automatiser les combinaisons sur [neal.fun/infinite-craft](https://neal.fun/infinite-craft), directement dans le navigateur.

## Fonctionnalités

- **Automation complète** — simule des vrais drag & drop sur l'écran, comme si tu le faisais à la main
- **Mémoire persistante** — les combinaisons déjà testées sont sauvegardées dans le `localStorage`, elles ne sont jamais refaites même après un rechargement de page
- **BFS intelligent** — teste toutes les paires possibles entre tes éléments, et ajoute automatiquement les nouveaux éléments découverts à la queue
- **HUD en jeu** — un overlay affiche en temps réel les stats (éléments, combos testées, combos skippées)
- **Stop propre** — bouton Stop dans le HUD, la mémoire est conservée

## Utilisation

1. Va sur **[neal.fun/infinite-craft](https://neal.fun/infinite-craft)**
2. Ouvre la console du navigateur (`F12`ou`ctrl+shift+i` → onglet **Console**)
3. Copie-colle le contenu de `ic-auto.js`
4. Appuie sur **Entrée**

C'est tout. Le script démarre automatiquement.

## HUD

Un overlay apparaît en haut à droite de l'écran :

```
Auto-Craft
Éléments : 42
Skippées (mémoire) : 128
Testées : 56
🔥 Fire + 💧 Water
[ ⏹ Stop ]  [ Reset mémoire ]
```

## Reset

Pour effacer la mémoire et tout retester depuis le début :

```js
localStorage.removeItem("ic_tried_combos")
```

Ou clique sur le bouton **Reset mémoire** dans le HUD.

## Configuration

En haut du script, tu peux modifier ces deux valeurs :

```js
const DELAY_AFTER_DROP = 400;  // Délai entre chaque combo (ms)
const DELAY_DRAG_STEP  = 14;   // Vitesse du drag (ms par étape)
```

Augmente `DELAY_AFTER_DROP` si le jeu rate des combinaisons.

## Comment ça fonctionne

1. **Scan** — lit tous les `div.item` dans la sidebar du jeu
2. **Queue** — génère toutes les paires possibles, en skippant celles déjà en mémoire
3. **Drag & Drop** — pour chaque paire, glisse A sur le canvas puis B sur A
4. **Détection** — après chaque combo, re-scanne la page pour voir si un nouvel élément est apparu
5. **Sauvegarde** — chaque combo testée est immédiatement sauvegardée dans le `localStorage`

## Compatibilité

| Navigateur | Support |
|------------|---------|
| Opera GX   | ✅      |
| Chrome     | ⚠️ Non testé |
| Edge       | ⚠️ Non testé |
| Safari     | ⚠️ Non testé |

## Licence

none -> interdiction de le modifier. (pour l'instant)
