
const Contact = () => {
    return (
        <section
            id="contact"
            aria-labelledby="contact-heading"
            className="bg-[#FCF1D0] px-5 py-16 sm:px-8 sm:py-20"
        >
            <div className="mx-auto max-w-7xl">
                <div className="max-w-2xl">
                    <p className="text-sm font-bold uppercase tracking-widest text-[#22396F]">
                        Contact us
                    </p>
                    <h2
                        id="contact-heading"
                        className="mt-3 text-3xl font-bold leading-tight tracking-tight text-[#22396F] sm:text-4xl"
                    >
                        We&apos;re here to help.
                    </h2>
                    <p className="mt-4 leading-7 text-black/70">
                        Have a question about Qick Sale? Get in touch and we&apos;ll be happy to help.
                    </p>
                </div>

                <div className="mt-8 grid gap-4 sm:grid-cols-2">
                    <a
                        href="mailto:nimrodcreatives.com@gmail.com"
                        className="group rounded-2xl border border-[#22396F]/10 bg-white p-6 transition-colors hover:border-[#22396F]/30 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#22396F]"
                    >
                        <span className="text-sm font-semibold text-black/60">Email</span>
                        <span className="mt-2 block break-all text-lg font-semibold text-[#22396F] group-hover:underline">
                            nimrodcreatives.com@gmail.com
                        </span>
                    </a>

                    <a
                        href="tel:0182433826"
                        className="group rounded-2xl border border-[#22396F]/10 bg-white p-6 transition-colors hover:border-[#22396F]/30 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#22396F]"
                    >
                        <span className="text-sm font-semibold text-black/60">Phone / WhatsApp</span>
                        <span className="mt-2 block text-lg font-semibold text-[#22396F] group-hover:underline">
                            0182433826
                        </span>
                    </a>
                </div>
            </div>
        </section>
    )
}
export default Contact