// The status vocabulary, in the order it should appear in the UI. The values
// match the CHECK constraint on the books table.
export const STATUSES = [
  { value: 'reading', label: 'Reading' },
  { value: 'want_to_read', label: 'Want to read' },
  { value: 'finished', label: 'Finished' },
]

export function statusLabel(value) {
  return STATUSES.find((status) => status.value === value)?.label ?? value
}

export const EMPTY_BOOK = {
  title: '',
  author: '',
  status: 'reading',
  rating: '',
  note: '',
}
