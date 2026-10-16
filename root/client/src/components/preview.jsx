import restaurantImage from '../assets/restraunt.jpg'

const Preview = () => {
  return (
    <section
      id="preview"
      aria-labelledby="restaurant-case-study"
      className="bg-white px-5 py-16 sm:px-8 sm:py-20"
    >
      <div className="mx-auto grid max-w-7xl items-center gap-10 lg:grid-cols-2 lg:gap-16">
        <div className="overflow-hidden rounded-3xl shadow-lg ring-1 ring-black/10">
          <img
            src={restaurantImage}
            alt="Restaurant dining area and counter during service"
            className="aspect-[4/3] w-full object-cover"
            loading="lazy"
          />
        </div>

        <div>
          <p className="text-sm font-bold uppercase tracking-widest text-[#22396F]">
            Restaurant case study
          </p>
          <h2
            id="restaurant-case-study"
            className="mt-3 text-3xl font-bold leading-tight tracking-tight text-black sm:text-4xl"
          >
            Better service starts with a clearer picture.
          </h2>
          <p className="mt-5 leading-7 text-black/70">
            Picture a busy restaurant taking orders by hand. Tickets can get
            mixed up, checkout slows down, and it is hard to know which items
            are running low. With a POS system, orders and payments are
            organized in one place, while staff can check sales and stock
            without relying on guesswork.
          </p>

          <ul className="mt-6 grid gap-3 sm:grid-cols-3">
            {[
              ['Organized', 'Keep orders together'],
              ['Faster', 'Make checkout smoother'],
              ['Informed', 'See sales and stock'],
            ].map(([title, description]) => (
              <li key={title} className="rounded-2xl bg-[#FCF1D0] p-4">
                <p className="font-semibold text-[#22396F]">{title}</p>
                <p className="mt-1 text-sm leading-5 text-black/70">{description}</p>
              </li>
            ))}
          </ul>

          <a
            href="#demo"
            className="mt-7 inline-flex min-h-11 items-center justify-center rounded-xl bg-[#22396F] px-5 py-3 text-sm font-semibold text-[#FCF1D0] transition-colors hover:bg-[#192b55] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#22396F]"
          >
            See how Karibu POS works
            <span aria-hidden="true" className="ml-2">→</span>
          </a>
        </div>
      </div>
    </section>
  )
}

export default Preview
