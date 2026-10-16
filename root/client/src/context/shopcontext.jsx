
import { createContext } from "react"


export const ShopContext = createContext()

const ShopContextProvider = (props) => {

  // Here is where majority of the Backend API are going to be called







    return(
        <>
        <ShopContext.Provider value={value}>
            {props.children}
        </ShopContext.Provider>
        </>
    )
}