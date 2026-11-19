import Contact from "../components/contact"
import Footer from "../components/footer"
import Hero from "../components/Hero"
import Navbar from "../components/Navbar"
import Preview from "../components/preview"
import Pricing from "./pricing"


const Home = () => {

    return (
        <>
        <Navbar/>
        <Hero/>
        <Preview/>
        <Pricing />
        <Contact />
        <Footer/>

        </>
    )
}
export default Home