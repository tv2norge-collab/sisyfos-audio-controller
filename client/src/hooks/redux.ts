import { TypedUseSelectorHook, useDispatch, useSelector } from "react-redux";
import { AppDispatch, ReduxStore } from "../../../shared/src/reducers/store";

export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<ReduxStore> = useSelector;
