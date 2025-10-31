# FRAMEWORK

### Current

- [x] Implementar StateObject como clase (extiende de State)
- [x] Crear un fichero de state-object-type-safe-check.ts
- [x] Implementar StateArray como clase (extiende de State)
- [x] Terminar de implementar `map()`
- [x] Implementar método `toArray()`
- [x] Adaptar `filter()` para que devuelva un StateArray
- [x] Implementar `at()` para que devuelva el signal en index
- [x] Implementar `length` como Calc<number>
- [x] Implementar `some()` para que devuelva un Calc<boolean>
- [x] Implementar `every()` para que devuelva un Calc<boolean>
- [x] Implementar `find()` para que devuelva un StateLike
- [x] Implementar método `clear()` para vaciar el array
- [x] Crear un fichero de state-array-type-safe-check.ts
- [x] Deshacer cambios relacionados con Signal.ts
- [x] Coger el mismo que en Accem
- [x] Coger el mismo que en Accem

---

- [ ] Implementar StateArray y StateObject `null/undefined` en `set()`
- [ ] Implementar método `clear()` para vaciar un StateObject
- [ ] `useRegister.ts` Coger el mismo que en Accem
- [ ] inferir el tipo de objeto `model`, no la interfaz
  - TableCtrl con buildRow, que le llega al item?
  - En principio esto se soluciona con StateObject y StateArray como clases

### BACKLOG

- [ ] Crear un fichero de state-type-safe-check.ts
- [ ] Tabular proyecto a 4 espacios
- [ ] Añadir comentarios de `deprecated` en useCtrl.ts sobre `state` y `setState`
- [ ] Fix doble init en `State`. (Tener en cuenta el `set` inicial en StateArray y StateObject)
- [ ] feat(StateArray, StateObject): Implementar `set` de State y Calc para linkar señales
- [ ] Reemplazar StateLike por Signal = State | StateObject | StateArray
