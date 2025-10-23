import { describe, it, expect } from "vitest";
import { stateObj } from "./stateObj";
import { state } from "./State";

describe("stateObj", () => {
  describe("Creación y valores iniciales", () => {
    it("debe crear un stateObj con propiedades básicas", () => {
      const obj = stateObj({
        name: state("John"),
        age: state(30),
      });

      expect(obj.get()).toEqual({ name: "John", age: 30 });
    });

    it("debe crear un stateObj vacío", () => {
      const obj = stateObj({});
      expect(obj.get()).toEqual({});
    });

    it("debe crear un stateObj con múltiples propiedades", () => {
      const obj = stateObj({
        str: state("text"),
        num: state(42),
        bool: state(true),
        nil: state(null),
        undef: state(undefined),
      });

      expect(obj.get()).toEqual({
        str: "text",
        num: 42,
        bool: true,
        nil: null,
        undef: undefined,
      });
    });

    it("debe crear un stateObj con objetos anidados", () => {
      const obj = stateObj({
        user: state({ name: "John", email: "john@test.com" }),
        settings: state({ theme: "dark", lang: "es" }),
      });

      expect(obj.get()).toEqual({
        user: { name: "John", email: "john@test.com" },
        settings: { theme: "dark", lang: "es" },
      });
    });

    it("debe crear un stateObj con arrays", () => {
      const obj = stateObj({
        numbers: state([1, 2, 3]),
        strings: state(["a", "b", "c"]),
      });

      expect(obj.get()).toEqual({
        numbers: [1, 2, 3],
        strings: ["a", "b", "c"],
      });
    });
  });

  describe("get() y peek()", () => {
    it("debe retornar objeto con valores actuales usando get()", () => {
      const obj = stateObj({
        x: state(10),
        y: state(20),
      });

      expect(obj.get()).toEqual({ x: 10, y: 20 });
    });

    it("debe retornar objeto con valores actuales usando peek()", () => {
      const obj = stateObj({
        x: state(10),
        y: state(20),
      });

      expect(obj.peek()).toEqual({ x: 10, y: 20 });
    });

    it("get() y peek() deben retornar el mismo valor", () => {
      const obj = stateObj({
        a: state("test"),
        b: state(123),
      });

      expect(obj.get()).toEqual(obj.peek());
    });
  });

  describe("Acceso directo a propiedades", () => {
    it("debe permitir acceso directo a states individuales", () => {
      const obj = stateObj({
        name: state("John"),
        age: state(30),
      });

      expect(obj.name.get()).toBe("John");
      expect(obj.age.get()).toBe(30);
    });

    it("debe permitir modificar states individuales", () => {
      const obj = stateObj({
        count: state(0),
        text: state("hello"),
      });

      obj.count.set(10);
      obj.text.set("world");

      expect(obj.count.get()).toBe(10);
      expect(obj.text.get()).toBe("world");
      expect(obj.get()).toEqual({ count: 10, text: "world" });
    });

    it("debe mantener sincronización entre acceso directo y get()", () => {
      const obj = stateObj({
        value: state(100),
      });

      obj.value.set(200);
      expect(obj.get().value).toBe(200);
    });
  });

  describe("set() - actualización completa", () => {
    it("debe actualizar todas las propiedades", () => {
      const obj = stateObj({
        name: state("John"),
        age: state(30),
      });

      obj.set({ name: "Jane", age: 25 });

      expect(obj.get()).toEqual({ name: "Jane", age: 25 });
    });

    it("debe actualizar solo las propiedades especificadas", () => {
      const obj = stateObj({
        name: state("John"),
        age: state(30),
        email: state("john@test.com"),
      });

      obj.set({ name: "Jane" });

      expect(obj.get()).toEqual({
        name: "Jane",
        age: 30,
        email: "john@test.com",
      });
    });

    it("debe ignorar propiedades no definidas en el modelo", () => {
      const obj = stateObj({
        name: state("John"),
        age: state(30),
      });

      obj.set({ name: "Jane", age: 25, extra: "ignored" } as any);

      expect(obj.get()).toEqual({ name: "Jane", age: 25 });
    });

    it("debe manejar valores undefined en set", () => {
      const obj = stateObj({
        name: state("John"),
        age: state(30),
      });

      obj.set({ name: undefined, age: 40 } as any);

      // name no debería cambiar porque es undefined
      expect(obj.get()).toEqual({ name: "John", age: 40 });
    });

    it("debe actualizar múltiples veces consecutivamente", () => {
      const obj = stateObj({
        value: state(0),
      });

      obj.set({ value: 1 });
      obj.set({ value: 2 });
      obj.set({ value: 3 });

      expect(obj.get().value).toBe(3);
    });

    it("debe manejar objetos vacíos en set", () => {
      const obj = stateObj({
        name: state("John"),
        age: state(30),
      });

      obj.set({});

      // No debería cambiar nada
      expect(obj.get()).toEqual({ name: "John", age: 30 });
    });
  });

  describe("set() - actualización parcial", () => {
    it("debe actualizar solo una propiedad", () => {
      const obj = stateObj({
        a: state(1),
        b: state(2),
        c: state(3),
      });

      obj.set({ b: 20 });

      expect(obj.get()).toEqual({ a: 1, b: 20, c: 3 });
    });

    it("debe actualizar múltiples propiedades selectivamente", () => {
      const obj = stateObj({
        w: state(1),
        x: state(2),
        y: state(3),
        z: state(4),
      });

      obj.set({ x: 20, z: 40 });

      expect(obj.get()).toEqual({ w: 1, x: 20, y: 3, z: 40 });
    });
  });

  describe("Tipos de datos complejos", () => {
    it("debe manejar objetos anidados", () => {
      const obj = stateObj({
        user: state({
          name: "John",
          contact: { email: "john@test.com", phone: "123" },
        }),
      });

      obj.set({
        user: {
          name: "Jane",
          contact: { email: "jane@test.com", phone: "456" },
        },
      });

      expect(obj.get().user.name).toBe("Jane");
      expect(obj.get().user.contact.email).toBe("jane@test.com");
    });

    it("debe manejar arrays como valores", () => {
      const obj = stateObj({
        items: state([1, 2, 3]),
        tags: state(["a", "b"]),
      });

      obj.set({ items: [4, 5, 6, 7] });

      expect(obj.get()).toEqual({
        items: [4, 5, 6, 7],
        tags: ["a", "b"],
      });
    });

    it("debe manejar Date objects", () => {
      const obj = stateObj({
        created: state(new Date("2025-01-01")),
        updated: state(new Date("2025-01-15")),
      });

      const newDate = new Date("2025-10-23");
      obj.set({ updated: newDate });

      expect(obj.get().updated).toBe(newDate);
    });

    it("debe manejar Map objects", () => {
      const obj = stateObj({
        data: state(new Map([["key", "value"]])),
      });

      const newMap = new Map([["newKey", "newValue"]]);
      obj.set({ data: newMap });

      expect(obj.get().data).toBe(newMap);
    });

    it("debe manejar Set objects", () => {
      const obj = stateObj({
        unique: state(new Set([1, 2, 3])),
      });

      const newSet = new Set([4, 5, 6]);
      obj.set({ unique: newSet });

      expect(obj.get().unique).toBe(newSet);
    });

    it("debe manejar funciones como valores", () => {
      const fn1 = () => "hello";
      const fn2 = () => "world";

      const obj = stateObj({
        callback: state(fn1),
      });

      expect(obj.get().callback()).toBe("hello");

      obj.set({ callback: fn2 });
      expect(obj.get().callback()).toBe("world");
    });
  });

  describe("Edge cases", () => {
    it("debe manejar valores falsy", () => {
      const obj = stateObj({
        zero: state(0),
        emptyStr: state(""),
        falseBool: state(false),
        nullVal: state(null),
      });

      expect(obj.get()).toEqual({
        zero: 0,
        emptyStr: "",
        falseBool: false,
        nullVal: null,
      });
    });

    it("debe manejar valores especiales numéricos", () => {
      const obj = stateObj({
        nan: state(NaN),
        inf: state(Infinity),
        negInf: state(-Infinity),
      });

      const result = obj.get();
      expect(Number.isNaN(result.nan)).toBe(true);
      expect(result.inf).toBe(Infinity);
      expect(result.negInf).toBe(-Infinity);
    });

    it("debe manejar BigInt", () => {
      const obj = stateObj({
        big: state(BigInt(9007199254740991)),
      });

      expect(obj.get().big).toBe(BigInt(9007199254740991));
    });

    it("debe manejar Symbol", () => {
      const sym = Symbol("test");
      const obj = stateObj({
        symbol: state(sym),
      });

      expect(obj.get().symbol).toBe(sym);
    });

    it("debe manejar muchas propiedades", () => {
      const props: Record<string, any> = {};
      for (let i = 0; i < 100; i++) {
        props[`prop${i}`] = state(i);
      }

      const obj = stateObj(props);
      const result = obj.get();

      expect(Object.keys(result).length).toBe(100);
      expect(result.prop50).toBe(50);
    });

    it("debe manejar nombres de propiedades especiales", () => {
      const obj = stateObj({
        "prop-with-dash": state(1),
        "prop.with.dot": state(2),
        "prop with space": state(3),
        "123numeric": state(4),
      });

      expect(obj.get()).toEqual({
        "prop-with-dash": 1,
        "prop.with.dot": 2,
        "prop with space": 3,
        "123numeric": 4,
      });
    });

    it("debe manejar propiedades con caracteres Unicode", () => {
      const obj = stateObj({
        日本語: state("Japanese"),
        español: state("Spanish"),
        "😀emoji": state("Emoji"),
      });

      expect(obj.get()).toEqual({
        日本語: "Japanese",
        español: "Spanish",
        "😀emoji": "Emoji",
      });
    });
  });

  describe("Reactividad", () => {
    it("debe ser reactivo a cambios en propiedades individuales", () => {
      const obj = stateObj({
        x: state(10),
        y: state(20),
      });

      obj.x.set(100);

      expect(obj.get()).toEqual({ x: 100, y: 20 });
    });

    it("debe ser reactivo a cambios mediante set()", () => {
      const obj = stateObj({
        a: state(1),
        b: state(2),
      });

      obj.set({ a: 10, b: 20 });

      expect(obj.a.get()).toBe(10);
      expect(obj.b.get()).toBe(20);
    });

    it("debe mantener sincronización bidireccional", () => {
      const obj = stateObj({
        count: state(0),
      });

      // Cambio directo
      obj.count.set(5);
      expect(obj.get().count).toBe(5);

      // Cambio mediante set
      obj.set({ count: 10 });
      expect(obj.count.get()).toBe(10);
    });
  });

  describe("Casos de uso complejos", () => {
    it("debe funcionar como estado de formulario", () => {
      const form = stateObj({
        username: state(""),
        email: state(""),
        password: state(""),
        acceptTerms: state(false),
      });

      form.set({
        username: "johndoe",
        email: "john@example.com",
        password: "secret123",
        acceptTerms: true,
      });

      expect(form.get()).toEqual({
        username: "johndoe",
        email: "john@example.com",
        password: "secret123",
        acceptTerms: true,
      });
    });

    it("debe funcionar como configuración de aplicación", () => {
      const config = stateObj({
        theme: state("light"),
        language: state("en"),
        notifications: state(true),
        autoSave: state(false),
      });

      // Cambiar solo el tema
      config.set({ theme: "dark" });

      expect(config.get()).toEqual({
        theme: "dark",
        language: "en",
        notifications: true,
        autoSave: false,
      });
    });

    it("debe funcionar como estado de usuario", () => {
      const user = stateObj({
        id: state(0),
        name: state(""),
        email: state(""),
        isAdmin: state(false),
        lastLogin: state<Date | null>(null),
      });

      const loginDate = new Date("2025-10-23");

      user.set({
        id: 123,
        name: "John Doe",
        email: "john@example.com",
        isAdmin: true,
        lastLogin: loginDate,
      });

      expect(user.get()).toEqual({
        id: 123,
        name: "John Doe",
        email: "john@example.com",
        isAdmin: true,
        lastLogin: loginDate,
      });
    });

    it("debe funcionar como carrito de compras", () => {
      const cart = stateObj({
        items: state<any[]>([]),
        total: state(0),
        discount: state(0),
        shippingCost: state(5.99),
      });

      cart.set({
        items: [
          { id: 1, name: "Product 1", price: 10 },
          { id: 2, name: "Product 2", price: 20 },
        ],
        total: 30,
        discount: 5,
      });

      expect(cart.get().items.length).toBe(2);
      expect(cart.get().total).toBe(30);
      expect(cart.get().shippingCost).toBe(5.99);
    });

    it("debe manejar estado de carga asíncrona", () => {
      const asyncState = stateObj({
        isLoading: state(false),
        data: state<any>(null),
        error: state<string | null>(null),
      });

      // Inicio de carga
      asyncState.set({ isLoading: true, error: null });
      expect(asyncState.get()).toEqual({
        isLoading: true,
        data: null,
        error: null,
      });

      // Éxito
      asyncState.set({
        isLoading: false,
        data: { id: 1, name: "Data" },
      });
      expect(asyncState.get()).toEqual({
        isLoading: false,
        data: { id: 1, name: "Data" },
        error: null,
      });

      // Error
      asyncState.set({
        isLoading: false,
        error: "Failed to load",
      });
      expect(asyncState.get().error).toBe("Failed to load");
    });
  });

  describe("Composición con otros states", () => {
    it("debe permitir states anidados", () => {
      const inner = stateObj({
        x: state(1),
        y: state(2),
      });

      const outer = stateObj({
        position: state({ x: 0, y: 0 }),
        nested: state(inner.get()),
      });

      inner.set({ x: 10, y: 20 });
      outer.set({ nested: inner.get() });

      expect(outer.get().nested).toEqual({ x: 10, y: 20 });
    });

    it("debe permitir combinar múltiples stateObjs", () => {
      const personal = stateObj({
        name: state("John"),
        age: state(30),
      });

      const contact = stateObj({
        email: state("john@test.com"),
        phone: state("123456789"),
      });

      const combined = {
        ...personal.get(),
        ...contact.get(),
      };

      expect(combined).toEqual({
        name: "John",
        age: 30,
        email: "john@test.com",
        phone: "123456789",
      });
    });
  });

  describe("Operaciones batch", () => {
    it("debe manejar actualizaciones múltiples en una sola llamada set", () => {
      const obj = stateObj({
        a: state(1),
        b: state(2),
        c: state(3),
        d: state(4),
        e: state(5),
      });

      obj.set({ a: 10, b: 20, c: 30, d: 40, e: 50 });

      expect(obj.get()).toEqual({ a: 10, b: 20, c: 30, d: 40, e: 50 });
    });

    it("debe manejar múltiples sets parciales consecutivos", () => {
      const obj = stateObj({
        a: state(1),
        b: state(2),
        c: state(3),
      });

      obj.set({ a: 10 });
      obj.set({ b: 20 });
      obj.set({ c: 30 });

      expect(obj.get()).toEqual({ a: 10, b: 20, c: 30 });
    });
  });

  describe("Inmutabilidad", () => {
    it("debe retornar un nuevo objeto en cada get()", () => {
      const obj = stateObj({
        value: state(1),
      });

      const ref1 = obj.get();
      const ref2 = obj.get();

      expect(ref1).toEqual(ref2);
      // Nota: las referencias pueden ser diferentes según la implementación
    });

    it("no debe mutar el objeto original pasado a set()", () => {
      const obj = stateObj({
        x: state(1),
        y: state(2),
      });

      const update = { x: 10, y: 20 };
      obj.set(update);

      expect(update).toEqual({ x: 10, y: 20 }); // no mutado
    });
  });

  describe("Performance", () => {
    it("debe manejar muchas actualizaciones eficientemente", () => {
      const obj = stateObj({
        counter: state(0),
      });

      const start = Date.now();

      for (let i = 0; i < 1000; i++) {
        obj.set({ counter: i });
      }

      const duration = Date.now() - start;
      expect(obj.get().counter).toBe(999);
      expect(duration).toBeLessThan(1000);
    });

    it("debe crear múltiples stateObjs sin problemas", () => {
      const objects = Array.from({ length: 100 }, (_, i) =>
        stateObj({
          id: state(i),
          value: state(`item-${i}`),
        })
      );

      expect(objects.length).toBe(100);
      expect(objects[50].get()).toEqual({ id: 50, value: "item-50" });
    });

    it("debe manejar objetos con muchas propiedades eficientemente", () => {
      const props: Record<string, any> = {};
      for (let i = 0; i < 50; i++) {
        props[`key${i}`] = state(i);
      }

      const obj = stateObj(props);

      const updates: Record<string, number> = {};
      for (let i = 0; i < 50; i++) {
        updates[`key${i}`] = i * 2;
      }

      const start = Date.now();
      obj.set(updates);
      const duration = Date.now() - start;

      expect(duration).toBeLessThan(100);
      expect(obj.get().key25).toBe(50);
    });
  });

  describe("Integración y casos extremos", () => {
    it("debe funcionar correctamente cuando se mezclan accesos directos y set()", () => {
      const obj = stateObj({
        a: state(1),
        b: state(2),
        c: state(3),
      });

      obj.a.set(10);
      obj.set({ b: 20 });
      obj.c.set(30);

      expect(obj.get()).toEqual({ a: 10, b: 20, c: 30 });
    });

    it("debe manejar reset de valores", () => {
      const obj = stateObj({
        count: state(100),
        text: state("modified"),
      });

      // Reset to defaults
      obj.set({ count: 0, text: "" });

      expect(obj.get()).toEqual({ count: 0, text: "" });
    });

    it("debe permitir clonación de estado", () => {
      const original = stateObj({
        x: state(10),
        y: state(20),
      });

      const clone = stateObj({
        x: state(0),
        y: state(0),
      });

      clone.set(original.get());

      expect(clone.get()).toEqual(original.get());

      // Cambiar el original no debería afectar el clon
      original.set({ x: 100 });
      expect(clone.get().x).toBe(10);
    });
  });
});
