import { Stack } from "expo-router"
import BurgerMenu from "@/components/ui/BurgerMenu"

export default function Layout() {
    return (
       <Stack
       screenOptions={{
        header: () => <BurgerMenu />
       }}
       /> 
    )
}