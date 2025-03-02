/**
 * Generates a simple fruit-based build identifier with emoji
 * Format: [Fruit] [Emoji] (e.g., "Apple 🍎" or "Banana 🍌")
 */
export function generateBuildId() {
  // Fruits with their corresponding emojis
  const fruits = [
    { name: "Apple", emoji: "🍎" },
    { name: "Banana", emoji: "🍌" },
    { name: "Cherry", emoji: "🍒" },
    { name: "Grape", emoji: "🍇" },
    { name: "Kiwi", emoji: "🥝" },
    { name: "Lemon", emoji: "🍋" },
    { name: "Mango", emoji: "🥭" },
    { name: "Orange", emoji: "🍊" },
    { name: "Peach", emoji: "🍑" },
    { name: "Pear", emoji: "🍐" },
    { name: "Pineapple", emoji: "🍍" },
    { name: "Strawberry", emoji: "🍓" },
    { name: "Watermelon", emoji: "🍉" },
    { name: "Blueberry", emoji: "🫐" },
    { name: "Coconut", emoji: "🥥" },
  ];

  // Select a random fruit
  const randomFruit = fruits[Math.floor(Math.random() * fruits.length)];

  // Create fruit-emoji build ID
  return `${randomFruit.emoji}`;
}

// This is computed once at build time and will be static for the deployment
export const BUILD_ID = generateBuildId();
