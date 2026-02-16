const morningGreetings = [
  'Good morning, {name}! What sort of creative chaos are we brewing today?',
  'Rise and grind, {name}! Your ad empire awaits.',
  'Morning, {name}! Coffee is hot and ideas are flowing.',
  'Top of the morning, {name}! Ready to turn some heads?',
]

const afternoonGreetings = [
  'Afternoon, {name}! Still riding that creative wave?',
  'Hey {name}, what sort of campaign madness are we making today?',
  'Good afternoon, creative force. What are we shipping next?',
  'Afternoon vibes, {name}. What masterpiece are we crafting?',
]

const eveningGreetings = [
  'Evening, {name}! The night is young and the ideas are flowing.',
  'Hey {name}, burning the midnight oil or just getting started?',
  'Evening, {name}! Let\'s make some ads that shine brighter than the stars.',
  'Night shift activated, {name}. Let\'s finish strong.',
]

const mondayGreetings = [
  'Monday motivation activated, {name}! What are we crushing this week?',
  'Happy Monday, {name}! New week, new ads to conquer.',
  'Monday morning, {name}. Let\'s turn those weekend vibes into campaign gold.',
]

const fridayGreetings = [
  'Friday energy, {name}! The weekend is near but the creativity is here.',
  'TGIF, {name}. Let\'s close the week with something unforgettable.',
  'Friday, {name}! Let\'s end the week with a creative mic drop.',
]

const shortLoading = [
  'Cooking up magic...',
  'Brewing brilliance...',
  'Warming up the creative engines...',
]

const mediumLoading = [
  'Consulting the creative gods...',
  'Teaching AI to understand your vision...',
  'Turning caffeine into campaigns...',
]

const longLoading = [
  'This is taking a moment because we are making it perfect...',
  'Teaching our AI the finer points of your brand aesthetic...',
  'Building your creative empire, one pixel at a time...',
]

export const successMessages = [
  'Variants generated! Feast your eyes on these beauties.',
  'Boom! Campaign is live and ready for magic.',
  'Success! You absolutely crushed it.',
  'Fresh variants, hot off the press.',
]

export const errorMessages = [
  'Oops! Something went sideways. Let\'s try that again.',
  'Hmm, that did not work as expected. Mind giving it another shot?',
  'We hit a snag, but don\'t worry. We\'ve got this.',
]

function pickRandom(messages: string[]): string {
  return messages[Math.floor(Math.random() * messages.length)]
}

export function getGreeting(name: string, now = new Date()): string {
  const day = now.getDay()
  const hour = now.getHours()

  if (day === 1 && Math.random() < 0.5) {
    return pickRandom(mondayGreetings).replace('{name}', name)
  }

  if (day === 5 && Math.random() < 0.5) {
    return pickRandom(fridayGreetings).replace('{name}', name)
  }

  if (hour >= 6 && hour < 12) {
    return pickRandom(morningGreetings).replace('{name}', name)
  }

  if (hour >= 12 && hour < 18) {
    return pickRandom(afternoonGreetings).replace('{name}', name)
  }

  return pickRandom(eveningGreetings).replace('{name}', name)
}

export function getLoadingMessage(secondsElapsed: number): string {
  if (secondsElapsed <= 3) {
    return pickRandom(shortLoading)
  }

  if (secondsElapsed <= 10) {
    return pickRandom(mediumLoading)
  }

  return pickRandom(longLoading)
}
