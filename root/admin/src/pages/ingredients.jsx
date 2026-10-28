import { useEffect, useRef, useState } from 'react'
import { useAuth } from '../context/useAuth'
import { addIngredient, deleteIngredient, getIngredients } from '../services/inventoryApi'

const ingredientUnits = [
  { value: 'g', label: 'Grams (g)' },
  { value: 'ml', label: 'Millilitres (ml)' },
  { value: 'piece', label: 'Piece' },
]

function Ingredients() {
  const { accessToken } = useAuth()
  const [ingredients, setIngredients] = useState([])
  const [ingredientRows, setIngredientRows] = useState([
    { id: 0, name: '', baseUnit: 'g', baseUnitQuantity: '0', lowStockThreshold: '0' },
  ])
  const nextIngredientRowId = useRef(1)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [loadError, setLoadError] = useState('')
  const [submitError, setSubmitError] = useState('')
  const [deleteError, setDeleteError] = useState('')
  const [deletingIngredientId, setDeletingIngredientId] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  useEffect(() => {
    let active = true

    getIngredients(accessToken)
      .then((result) => {
        if (active) setIngredients(result.ingredients)
      })
      .catch((error) => {
        if (active) setLoadError(error.message)
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [accessToken])

  async function handleSubmit(event) {
    event.preventDefault()
    setSubmitError('')
    setSuccessMessage('')
    setSubmitting(true)

    try {
      if (ingredientRows.some((row) => !row.name.trim())) {
        throw new Error('Enter a name for each ingredient before submitting.')
      }
      const payload = ingredientRows.map((row) => ({
        name: row.name.trim(),
        baseUnit: row.baseUnit,
        baseUnitQuantity: Number(row.baseUnitQuantity),
        lowStockThreshold: Number(row.lowStockThreshold),
      }))
      const result = await addIngredient(accessToken, payload)
      setIngredients((current) =>
        [...result.ingredients, ...current].sort((left, right) =>
          left.name.localeCompare(right.name),
        ),
      )
      setIngredientRows([{
        id: nextIngredientRowId.current++,
        name: '',
        baseUnit: 'g',
        baseUnitQuantity: '0',
        lowStockThreshold: '0',
      }])
      setSuccessMessage(
        result.message || `${result.ingredients.length} ingredient(s) added successfully.`,
      )
    } catch (error) {
      setSubmitError(error.message)
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDeleteIngredient(ingredient) {
    if (!window.confirm(`Delete "${ingredient.name}"? It will be deactivated while its stock and recipe history are retained.`)) return

    setDeleteError('')
    setDeletingIngredientId(ingredient._id)
    try {
      const result = await deleteIngredient(accessToken, ingredient._id)
      setIngredients((current) => current.map((item) =>
        item._id === result.ingredient._id ? result.ingredient : item,
      ))
    } catch (error) {
      setDeleteError(error.message)
    } finally {
      setDeletingIngredientId('')
    }
  }

  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm font-semibold text-[#547A95]">ADMIN WORKSPACE</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-[#2C3947]">Ingredients</h1>
        <p className="mt-2 text-sm text-slate-500">
          Add ingredients used in your menu and set their low-stock thresholds.
        </p>
      </header>

      <section className="rounded-2xl border border-[#547A95]/15 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-[#2C3947]">Add ingredients</h2>
            <p className="mt-1 text-sm text-slate-500">Add up to 100 ingredients in one batch.</p>
          </div>
          <button
            className="rounded-xl border border-[#547A95]/30 px-4 py-2.5 text-sm font-semibold text-[#547A95] transition hover:bg-[#547A95]/5 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={submitting || ingredientRows.length >= 100}
            onClick={() => setIngredientRows((rows) => [
              ...rows,
              {
                id: nextIngredientRowId.current++,
                name: '',
                baseUnit: 'g',
                baseUnitQuantity: '0',
                lowStockThreshold: '0',
              },
            ])}
            type="button"
          >
            Add another row
          </button>
        </div>
        <form className="mt-5 space-y-4" onSubmit={handleSubmit}>
          {ingredientRows.map((row, index) => (
            <fieldset className="grid gap-4 rounded-xl border border-[#547A95]/15 p-4 sm:grid-cols-2 xl:grid-cols-5" key={row.id}>
              <legend className="px-1 text-sm font-semibold text-[#547A95]">
                Ingredient {index + 1}
              </legend>
              <label className="text-sm font-medium text-[#2C3947]">
                Ingredient name
                <input
                  className="mt-1.5 w-full rounded-xl border border-slate-300 px-3.5 py-3 outline-none focus:border-[#547A95] focus:ring-2 focus:ring-[#547A95]/20"
                  maxLength={100}
                  onChange={(event) => setIngredientRows((rows) => rows.map((item, itemIndex) =>
                    itemIndex === index ? { ...item, name: event.target.value } : item,
                  ))}
                  placeholder="e.g. All-purpose flour"
                  required
                  value={row.name}
                />
              </label>
              <label className="text-sm font-medium text-[#2C3947]">
                Base unit
                <select
                  className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-3 outline-none focus:border-[#547A95] focus:ring-2 focus:ring-[#547A95]/20"
                  onChange={(event) => setIngredientRows((rows) => rows.map((item, itemIndex) =>
                    itemIndex === index ? { ...item, baseUnit: event.target.value } : item,
                  ))}
                  value={row.baseUnit}
                >
                  {ingredientUnits.map((unit) => (
                    <option key={unit.value} value={unit.value}>{unit.label}</option>
                  ))}
                </select>
              </label>
              <label className="text-sm font-medium text-[#2C3947]">
                Starting stock ({row.baseUnit})
                <input
                  className="mt-1.5 w-full rounded-xl border border-slate-300 px-3.5 py-3 outline-none focus:border-[#547A95] focus:ring-2 focus:ring-[#547A95]/20"
                  min="0"
                  onChange={(event) => setIngredientRows((rows) => rows.map((item, itemIndex) =>
                    itemIndex === index ? { ...item, baseUnitQuantity: event.target.value } : item,
                  ))}
                  required
                  step="any"
                  type="number"
                  value={row.baseUnitQuantity}
                />
              </label>
              <label className="text-sm font-medium text-[#2C3947]">
                Low-stock threshold
                <input
                  className="mt-1.5 w-full rounded-xl border border-slate-300 px-3.5 py-3 outline-none focus:border-[#547A95] focus:ring-2 focus:ring-[#547A95]/20"
                  min="0"
                  onChange={(event) => setIngredientRows((rows) => rows.map((item, itemIndex) =>
                    itemIndex === index ? { ...item, lowStockThreshold: event.target.value } : item,
                  ))}
                  required
                  step="any"
                  type="number"
                  value={row.lowStockThreshold}
                />
              </label>
              <div className="flex items-end">
                <button
                  className="w-full rounded-xl border border-red-200 px-4 py-3 font-semibold text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
                  disabled={submitting || ingredientRows.length === 1}
                  onClick={() => setIngredientRows((rows) => rows.filter((_, itemIndex) => itemIndex !== index))}
                  type="button"
                >
                  Remove
                </button>
              </div>
            </fieldset>
          ))}
          <div className="flex justify-end">
            <button
              className="rounded-xl bg-[#547A95] px-5 py-3 font-semibold text-white transition hover:bg-[#42657e] disabled:cursor-not-allowed disabled:opacity-60"
              disabled={submitting}
              type="submit"
            >
              {submitting ? 'Adding ingredients…' : `Add ${ingredientRows.length} ingredient${ingredientRows.length === 1 ? '' : 's'}`}
            </button>
          </div>
        </form>
        {submitError && <p className="mt-4 text-sm text-red-700" role="alert">{submitError}</p>}
        {successMessage && <p className="mt-4 text-sm text-emerald-700" role="status">{successMessage}</p>}
      </section>

      <section className="overflow-hidden rounded-2xl border border-[#547A95]/15 bg-white shadow-sm">
        <div className="border-b border-[#547A95]/15 px-5 py-4 sm:px-6">
          <h2 className="font-bold text-[#2C3947]">Your ingredients</h2>
        </div>
        {deleteError && <p className="px-6 pt-4 text-sm text-red-700" role="alert">{deleteError}</p>}
        {loadError ? (
          <p className="p-6 text-sm text-red-700" role="alert">{loadError}</p>
        ) : loading ? (
          <p className="p-6 text-sm text-slate-500" role="status">Loading ingredients…</p>
        ) : ingredients.length === 0 ? (
          <p className="p-8 text-center text-sm text-slate-500">
            No ingredients yet. Add your first ingredient using the form above.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="bg-[#547A95]/5 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-3 font-semibold">Ingredient</th>
                  <th className="px-5 py-3 font-semibold">Base unit</th>
                  <th className="px-5 py-3 font-semibold">Current stock</th>
                  <th className="px-5 py-3 font-semibold">Low-stock threshold</th>
                  <th className="px-5 py-3 font-semibold">Status</th>
                  <th className="px-5 py-3 font-semibold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#547A95]/10">
                {ingredients.map((ingredient) => (
                  <tr key={ingredient._id}>
                    <td className="px-5 py-4 font-medium text-[#2C3947]">{ingredient.name}</td>
                    <td className="px-5 py-4 text-slate-600">{ingredient.baseUnit}</td>
                    <td className="px-5 py-4 text-slate-600">{ingredient.baseUnitQuantity} {ingredient.baseUnit}</td>
                    <td className="px-5 py-4 text-slate-600">{ingredient.lowStockThreshold} {ingredient.baseUnit}</td>
                    <td className="px-5 py-4">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${ingredient.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                        {ingredient.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      {ingredient.isActive && (
                        <button
                          className="rounded-lg border border-red-200 px-3 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                          disabled={deletingIngredientId === ingredient._id}
                          onClick={() => handleDeleteIngredient(ingredient)}
                          type="button"
                        >
                          {deletingIngredientId === ingredient._id ? 'Deleting…' : 'Delete'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}

export default Ingredients
