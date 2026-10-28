import { useEffect, useRef, useState } from 'react'
import { useAuth } from '../context/useAuth'
import { addMenuItem, deleteMenuItem, getMenuItems } from '../services/menuApi'
import { getIngredients } from '../services/inventoryApi'

function MenuItems() {
  const { accessToken } = useAuth()
  const [menuItems, setMenuItems] = useState([])
  const [loadingMenuItems, setLoadingMenuItems] = useState(true)
  const [menuLoadError, setMenuLoadError] = useState('')
  const [menuDeleteError, setMenuDeleteError] = useState('')
  const [deletingMenuItemId, setDeletingMenuItemId] = useState('')
  const [menuItemsVersion, setMenuItemsVersion] = useState(0)
  const [ingredients, setIngredients] = useState([])
  const [loadingIngredients, setLoadingIngredients] = useState(true)
  const [ingredientLoadError, setIngredientLoadError] = useState('')
  const [form, setForm] = useState({
    name: '',
    category: '',
    price: '',
    trackInventory: false,
    isAvailable: true,
  })
  const [recipeRows, setRecipeRows] = useState([
    { id: 0, ingredientId: '', quantity: '' },
  ])
  const nextRecipeRowId = useRef(1)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  useEffect(() => {
    let active = true

    getMenuItems(accessToken)
      .then((result) => {
        if (active) setMenuItems(result)
      })
      .catch((requestError) => {
        if (active) setMenuLoadError(requestError.message)
      })
      .finally(() => {
        if (active) setLoadingMenuItems(false)
      })

    return () => {
      active = false
    }
  }, [accessToken, menuItemsVersion])

  useEffect(() => {
    let active = true

    getIngredients(accessToken)
      .then((result) => {
        if (active) setIngredients(result.ingredients.filter((ingredient) => ingredient.isActive))
      })
      .catch((requestError) => {
        if (active) setIngredientLoadError(requestError.message)
      })
      .finally(() => {
        if (active) setLoadingIngredients(false)
      })

    return () => {
      active = false
    }
  }, [accessToken])

  function updateField(event) {
    const { name, value, type, checked } = event.target
    setForm((current) => ({
      ...current,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setSuccessMessage('')
    setSubmitting(true)

    try {
      const recipe = recipeRows
        .filter((row) => row.ingredientId)
        .map((row) => ({
          ingredientId: row.ingredientId,
          quantity: Number(row.quantity),
        }))
      if (form.trackInventory && (
        recipe.length === 0 ||
        recipe.length !== recipeRows.length ||
        recipe.some((item) => !Number.isFinite(item.quantity) || item.quantity < 0.001)
      )) {
        throw new Error('Choose an ingredient and enter a recipe quantity of at least 0.001 for each recipe row.')
      }

      const menuItem = await addMenuItem(accessToken, {
        name: form.name.trim(),
        category: form.category.trim(),
        price: Number(form.price),
        trackInventory: form.trackInventory,
        isAvailable: form.isAvailable,
        recipe: form.trackInventory ? recipe : [],
      })
      setForm({
        name: '',
        category: '',
        price: '',
        trackInventory: false,
        isAvailable: true,
      })
      setRecipeRows([{ id: nextRecipeRowId.current++, ingredientId: '', quantity: '' }])
      setSuccessMessage(`${menuItem.name} was added to your menu.`)
      setLoadingMenuItems(true)
      setMenuLoadError('')
      setMenuItemsVersion((version) => version + 1)
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDeleteMenuItem(menuItem) {
    if (!window.confirm(`Delete "${menuItem.name}" from the menu?`)) return

    setMenuDeleteError('')
    setDeletingMenuItemId(menuItem._id)
    try {
      await deleteMenuItem(accessToken, menuItem._id)
      setMenuItems((current) => current.filter((item) => item._id !== menuItem._id))
    } catch (requestError) {
      setMenuDeleteError(requestError.message)
    } finally {
      setDeletingMenuItemId('')
    }
  }

  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm font-semibold text-[#547A95]">ADMIN WORKSPACE</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-[#2C3947]">Menu items</h1>
        <p className="mt-2 text-sm text-slate-500">Add products and prices to your restaurant menu.</p>
      </header>

      <section className="max-w-2xl rounded-2xl border border-[#547A95]/15 bg-white p-6 shadow-sm sm:p-8">
        <h2 className="text-lg font-semibold text-[#2C3947]">Add a menu item</h2>
        <form className="mt-5 space-y-4" onSubmit={handleSubmit}>
          <label className="block text-sm font-medium text-[#2C3947]">
            Item name
            <input
              className="mt-1.5 w-full rounded-xl border border-slate-300 px-3.5 py-3 outline-none transition focus:border-[#547A95] focus:ring-2 focus:ring-[#547A95]/20"
              maxLength={100}
              name="name"
              onChange={updateField}
              required
              value={form.name}
            />
          </label>
          <label className="block text-sm font-medium text-[#2C3947]">
            Category
            <input
              className="mt-1.5 w-full rounded-xl border border-slate-300 px-3.5 py-3 outline-none transition focus:border-[#547A95] focus:ring-2 focus:ring-[#547A95]/20"
              maxLength={100}
              name="category"
              onChange={updateField}
              placeholder="e.g. Main course"
              required
              value={form.category}
            />
          </label>
          <label className="block text-sm font-medium text-[#2C3947]">
            Price
            <input
              className="mt-1.5 w-full rounded-xl border border-slate-300 px-3.5 py-3 outline-none transition focus:border-[#547A95] focus:ring-2 focus:ring-[#547A95]/20"
              min="0"
              name="price"
              onChange={updateField}
              required
              step="0.01"
              type="number"
              value={form.price}
            />
          </label>
          <label className="flex items-center gap-3 text-sm font-medium text-[#2C3947]">
            <input
              checked={form.isAvailable}
              className="h-4 w-4 accent-[#547A95]"
              name="isAvailable"
              onChange={updateField}
              type="checkbox"
            />
            Available to sell
          </label>
          <label className="flex items-center gap-3 text-sm font-medium text-[#2C3947]">
            <input
              checked={form.trackInventory}
              className="h-4 w-4 accent-[#547A95]"
              name="trackInventory"
              onChange={updateField}
              type="checkbox"
            />
            Track inventory for this item
          </label>
          {form.trackInventory && (
            <fieldset className="space-y-4 rounded-xl border border-[#547A95]/20 p-4">
              <legend className="px-1 text-sm font-semibold text-[#547A95]">Recipe per menu item</legend>
              <p className="text-sm text-slate-500">
                Set how much of each ingredient one serving uses. Quantities use the ingredient’s base unit.
              </p>
              {ingredientLoadError ? (
                <p className="text-sm text-red-700" role="alert">{ingredientLoadError}</p>
              ) : loadingIngredients ? (
                <p className="text-sm text-slate-500" role="status">Loading ingredients…</p>
              ) : ingredients.length === 0 ? (
                <p className="text-sm text-slate-500">Add an active ingredient before setting a recipe.</p>
              ) : (
                <>
                  {recipeRows.map((row, index) => {
                    const selectedIngredient = ingredients.find(
                      (ingredient) => ingredient._id === row.ingredientId,
                    )
                    const usedIngredientIds = recipeRows
                      .filter((recipeRow) => recipeRow.id !== row.id)
                      .map((recipeRow) => recipeRow.ingredientId)

                    return (
                      <div className="grid gap-3 rounded-lg bg-slate-50 p-3 sm:grid-cols-[1fr_1fr_auto]" key={row.id}>
                        <label className="text-sm font-medium text-[#2C3947]">
                          Ingredient {index + 1}
                          <select
                            className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-3 outline-none focus:border-[#547A95] focus:ring-2 focus:ring-[#547A95]/20"
                            onChange={(event) => setRecipeRows((rows) => rows.map((recipeRow) =>
                              recipeRow.id === row.id
                                ? { ...recipeRow, ingredientId: event.target.value }
                                : recipeRow,
                            ))}
                            required
                            value={row.ingredientId}
                          >
                            <option value="">Choose an ingredient</option>
                            {ingredients.map((ingredient) => (
                              <option
                                disabled={usedIngredientIds.includes(ingredient._id)}
                                key={ingredient._id}
                                value={ingredient._id}
                              >
                                {ingredient.name} — stock: {ingredient.baseUnitQuantity} {ingredient.baseUnit}
                              </option>
                            ))}
                          </select>
                        </label>
                        <label className="text-sm font-medium text-[#2C3947]">
                          Quantity per item {selectedIngredient ? `(${selectedIngredient.baseUnit})` : ''}
                          <input
                            className="mt-1.5 w-full rounded-xl border border-slate-300 px-3.5 py-3 outline-none focus:border-[#547A95] focus:ring-2 focus:ring-[#547A95]/20"
                            min="0.001"
                            onChange={(event) => setRecipeRows((rows) => rows.map((recipeRow) =>
                              recipeRow.id === row.id
                                ? { ...recipeRow, quantity: event.target.value }
                                : recipeRow,
                            ))}
                            required
                            step="any"
                            type="number"
                            value={row.quantity}
                          />
                        </label>
                        <button
                          className="self-end rounded-xl border border-red-200 px-4 py-3 font-semibold text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
                          disabled={recipeRows.length === 1}
                          onClick={() => setRecipeRows((rows) => rows.filter((recipeRow) => recipeRow.id !== row.id))}
                          type="button"
                        >
                          Remove
                        </button>
                      </div>
                    )
                  })}
                  <button
                    className="rounded-xl border border-[#547A95]/30 px-4 py-2.5 text-sm font-semibold text-[#547A95] transition hover:bg-[#547A95]/5"
                    onClick={() => setRecipeRows((rows) => [
                      ...rows,
                      { id: nextRecipeRowId.current++, ingredientId: '', quantity: '' },
                    ])}
                    type="button"
                  >
                    Add recipe ingredient
                  </button>
                </>
              )}
            </fieldset>
          )}
          {error && <p className="text-sm text-red-700" role="alert">{error}</p>}
          {successMessage && <p className="text-sm text-emerald-700" role="status">{successMessage}</p>}
          <button
            className="rounded-xl bg-[#547A95] px-5 py-3 font-semibold text-white transition hover:bg-[#42657e] disabled:cursor-not-allowed disabled:opacity-60"
            disabled={submitting}
            type="submit"
          >
            {submitting ? 'Adding menu item…' : 'Add menu item'}
          </button>
        </form>
      </section>

      <section className="overflow-hidden rounded-2xl border border-[#547A95]/15 bg-white shadow-sm">
        <div className="border-b border-[#547A95]/15 px-5 py-4 sm:px-6">
          <h2 className="font-bold text-[#2C3947]">Your menu items</h2>
        </div>
        {menuDeleteError && <p className="px-6 pt-4 text-sm text-red-700" role="alert">{menuDeleteError}</p>}
        {menuLoadError ? (
          <p className="p-6 text-sm text-red-700" role="alert">{menuLoadError}</p>
        ) : loadingMenuItems ? (
          <p className="p-6 text-sm text-slate-500" role="status">Loading menu items…</p>
        ) : menuItems.length === 0 ? (
          <p className="p-8 text-center text-sm text-slate-500">No menu items have been added yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="bg-[#547A95]/5 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-3 font-semibold">Name</th>
                  <th className="px-5 py-3 font-semibold">Category</th>
                  <th className="px-5 py-3 font-semibold">Price</th>
                  <th className="px-5 py-3 font-semibold">Recipe</th>
                  <th className="px-5 py-3 font-semibold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#547A95]/10">
                {menuItems.map((menuItem) => (
                  <tr key={menuItem._id}>
                    <td className="px-5 py-4 font-medium text-[#2C3947]">{menuItem.name}</td>
                    <td className="px-5 py-4 text-slate-600">{menuItem.category}</td>
                    <td className="px-5 py-4 text-slate-600">
                      {new Intl.NumberFormat('en-KE', {
                        style: 'currency',
                        currency: 'KES',
                        maximumFractionDigits: 0,
                      }).format(menuItem.price)}
                    </td>
                    <td className="px-5 py-4 text-slate-600">
                      {menuItem.trackInventory && menuItem.recipe?.length
                        ? menuItem.recipe.map((recipeItem) => (
                          `${recipeItem.ingredientId?.name || 'Ingredient'} (${recipeItem.quantity} ${recipeItem.ingredientId?.baseUnit || ''})`
                        )).join(', ')
                        : 'Not tracked'}
                    </td>
                    <td className="px-5 py-4">
                      <button
                        className="rounded-lg border border-red-200 px-3 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                        disabled={deletingMenuItemId === menuItem._id}
                        onClick={() => handleDeleteMenuItem(menuItem)}
                        type="button"
                      >
                        {deletingMenuItemId === menuItem._id ? 'Deleting…' : 'Delete'}
                      </button>
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

export default MenuItems
