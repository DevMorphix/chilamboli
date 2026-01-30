<template>
  <div
    v-if="registration"
    class="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end sm:items-center justify-center p-4"
    @click.self="handleClose"
  >
    <div
      class="bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-xl"
      @click.stop
    >
      <!-- Modal Header -->
      <div class="sticky top-0 bg-white border-b border-gray-200 px-4 py-4 flex items-center justify-between z-10">
        <div class="flex-1 min-w-0">
          <div class="text-2xl font-bold text-gray-900 mb-1">
            {{ registration.chestNumber || `Registration #${registration.id.slice(0, 8).toUpperCase()}` }}
          </div>
          <p class="text-xs text-gray-500">
            {{ registration.participantCount }} participant{{ registration.participantCount !== 1 ? 's' : '' }}
          </p>
        </div>
        <button
          @click="handleClose"
          class="ml-4 p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 flex-shrink-0"
        >
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <!-- Modal Content -->
      <div class="p-4 sm:p-6 space-y-5">
        <!-- Note about anonymity -->
        <div class="p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p class="text-xs text-blue-800 flex items-start">
            <svg class="w-4 h-4 mr-1.5 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Registration details are anonymized to ensure fair and unbiased judging.</span>
          </p>
        </div>

        <!-- Scoring Form -->
        <form @submit.prevent="handleSubmit" class="space-y-5">
          <div>
            <label class="block text-sm font-semibold text-gray-700 mb-3">
              Score (0-50)
            </label>
            <input
              :value="judgmentForm.score !== null ? judgmentForm.score.toString() : ''"
              @input="handleScoreInput"
              @keydown="handleScoreKeydown"
              @paste="handleScorePaste"
              type="text"
              inputmode="decimal"
              pattern="[0-9]*\.?[0-9]*"
              required
              placeholder="0.0"
              :class="[
                'w-full px-6 py-4 text-3xl font-bold text-center border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors',
                scoreError ? 'border-red-300 bg-red-50' : 'border-gray-300 focus:border-purple-500'
              ]"
            />
            <div class="mt-2 space-y-1">
              <p v-if="scoreError" class="text-xs font-medium text-red-600">
                {{ scoreError }}
              </p>
              <p v-else class="text-xs text-gray-500">
                Enter a score between 0.0 and 50.0 (one decimal place allowed)
              </p>
            </div>
          </div>

          <div>
            <label class="block text-sm font-semibold text-gray-700 mb-2">
              Comments (Optional)
            </label>
            <textarea
              v-model="judgmentForm.comments"
              rows="4"
              placeholder="Add any comments or feedback (optional)..."
              class="w-full px-4 py-3 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
            ></textarea>
          </div>

          <div class="flex gap-3 pt-2">
            <button
              type="button"
              @click="handleClose"
              class="flex-1 px-4 py-3 text-gray-700 bg-gray-100 hover:bg-gray-200 font-medium rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              :disabled="submitting || scoreError !== '' || judgmentForm.score === null"
              class="flex-1 px-4 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
            >
              {{ submitting ? 'Saving...' : registration.judgment ? 'Update' : 'Submit' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  registration: any | null
  submitting?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  submitting: false,
})

const emit = defineEmits<{
  close: []
  submit: [score: number, comments: string | null]
}>()

const judgmentForm = ref({
  score: null as number | null,
  comments: '',
})

const scoreError = ref<string>('')

const validateScore = (value: string): { valid: boolean; numValue: number | null; error: string } => {
  if (!value || value.trim() === '') {
    return { valid: false, numValue: null, error: '' }
  }

  // Remove any non-numeric characters except decimal point
  const cleaned = value.replace(/[^\d.]/g, '')
  
  // Check for multiple decimal points
  const decimalCount = (cleaned.match(/\./g) || []).length
  if (decimalCount > 1) {
    return { valid: false, numValue: null, error: 'Only one decimal point allowed' }
  }

  // Check decimal places (max 1)
  if (cleaned.includes('.')) {
    const parts = cleaned.split('.')
    if (parts[1] && parts[1].length > 1) {
      return { valid: false, numValue: null, error: 'Maximum one decimal place allowed' }
    }
  }

  const numValue = parseFloat(cleaned)
  
  if (isNaN(numValue)) {
    return { valid: false, numValue: null, error: 'Please enter a valid number' }
  }

  if (numValue < 0 || numValue > 50) {
    return { valid: false, numValue: numValue, error: 'Score must be between 0.0 and 50.0' }
  }

  return { valid: true, numValue: numValue, error: '' }
}

const handleScoreInput = (event: Event) => {
  const target = event.target as HTMLInputElement
  let value = target.value
  
  // Clean the input - remove any non-numeric characters except decimal point
  let cleaned = value.replace(/[^\d.]/g, '')
  
  // Handle multiple decimal points - keep only the first one
  const decimalIndex = cleaned.indexOf('.')
  if (decimalIndex !== -1) {
    cleaned = cleaned.substring(0, decimalIndex + 1) + cleaned.substring(decimalIndex + 1).replace(/\./g, '')
  }
  
  // Limit to one decimal place
  if (cleaned.includes('.')) {
    const parts = cleaned.split('.')
    if (parts[1] && parts[1].length > 1) {
      cleaned = parts[0] + '.' + parts[1].charAt(0)
    }
  }
  
  // Prevent values greater than 50
  const numValue = cleaned ? parseFloat(cleaned) : NaN
  if (!isNaN(numValue) && numValue > 50) {
    cleaned = '50'
  }
  
  // Update the input value
  target.value = cleaned
  
  // Validate and update form
  const validation = validateScore(cleaned)
  scoreError.value = validation.error
  
  if (validation.valid && validation.numValue !== null) {
    judgmentForm.value.score = validation.numValue
  } else if (cleaned === '' || cleaned === '.') {
    judgmentForm.value.score = null
    if (cleaned === '') {
      scoreError.value = ''
    }
  }
}

const handleScoreKeydown = (event: KeyboardEvent) => {
  const target = event.target as HTMLInputElement
  const key = event.key
  
  // Allow: backspace, delete, tab, escape, enter, decimal point
  if (['Backspace', 'Delete', 'Tab', 'Escape', 'Enter'].includes(key)) {
    return
  }
  
  // Allow: Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X
  if (event.ctrlKey && ['a', 'c', 'v', 'x'].includes(key.toLowerCase())) {
    return
  }
  
  // Allow: home, end, left, right arrows
  if (['Home', 'End', 'ArrowLeft', 'ArrowRight'].includes(key)) {
    return
  }
  
  // Allow decimal point if not already present
  if (key === '.' && !target.value.includes('.')) {
    return
  }
  
  // Allow numbers
  if (/^\d$/.test(key)) {
    const currentValue = target.value
    // If current value is already at max (50.0), prevent more input
    if (currentValue === '50' || currentValue === '50.0' || currentValue === '50.') {
      if (key !== '0' && key !== '.') {
        event.preventDefault()
        return
      }
    }
    // If current value is 50 and trying to add more digits after decimal
    if (currentValue === '50' && key === '0') {
      return // Allow decimal part
    }
    // Prevent entering more than 50
    const testValue = currentValue + key
    const numValue = parseFloat(testValue)
    if (!isNaN(numValue) && numValue > 50) {
      event.preventDefault()
      return
    }
    return
  }
  
  // Block everything else
  event.preventDefault()
}

const handleScorePaste = (event: ClipboardEvent) => {
  event.preventDefault()
  const pastedText = event.clipboardData?.getData('text') || ''
  
  // Clean pasted text
  let cleaned = pastedText.replace(/[^\d.]/g, '')
  
  // Handle multiple decimal points - keep only the first one
  const decimalIndex = cleaned.indexOf('.')
  if (decimalIndex !== -1) {
    cleaned = cleaned.substring(0, decimalIndex + 1) + cleaned.substring(decimalIndex + 1).replace(/\./g, '')
  }
  
  // Limit to one decimal place
  if (cleaned.includes('.')) {
    const parts = cleaned.split('.')
    if (parts[1] && parts[1].length > 1) {
      cleaned = parts[0] + '.' + parts[1].charAt(0)
    }
  }
  
  // Prevent values greater than 50
  const numValue = cleaned ? parseFloat(cleaned) : NaN
  if (!isNaN(numValue) && numValue > 50) {
    cleaned = '50'
  }
  
  // Update input value
  const target = event.target as HTMLInputElement
  target.value = cleaned
  
  // Trigger input event to update form state
  const inputEvent = new Event('input', { bubbles: true })
  target.dispatchEvent(inputEvent)
}

const handleClose = () => {
  judgmentForm.value = {
    score: null,
    comments: '',
  }
  scoreError.value = ''
  emit('close')
}

const handleSubmit = () => {
  if (!props.registration) {
    return
  }

  // Validate score
  if (judgmentForm.value.score === null) {
    scoreError.value = 'Please enter a score'
    return
  }

  const validation = validateScore(judgmentForm.value.score.toString())
  if (!validation.valid) {
    scoreError.value = validation.error || 'Please enter a valid score between 0.0 and 50.0'
    return
  }

  if (judgmentForm.value.score < 0 || judgmentForm.value.score > 50) {
    scoreError.value = 'Score must be between 0.0 and 50.0'
    return
  }

  // Round to 1 decimal place
  const finalScore = Math.round(judgmentForm.value.score * 10) / 10
  
  emit('submit', finalScore, judgmentForm.value.comments || null)
}

// Watch for registration changes to update form
watch(() => props.registration, (newRegistration) => {
  if (newRegistration) {
    judgmentForm.value = {
      score: newRegistration.judgment?.score || null,
      comments: newRegistration.judgment?.comments || '',
    }
    scoreError.value = ''
  }
}, { immediate: true })
</script>
