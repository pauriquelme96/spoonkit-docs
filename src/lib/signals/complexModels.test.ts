import { describe, it, expect, vi } from "vitest";
import { stateObj } from "./stateObj";
import { stateArray } from "./stateArr";
import { state } from "./State";
import { calc } from "./Calc";
import { monitor } from "./Monitor";

describe("Modelos Complejos - stateObj + stateArray", () => {
  describe("Modelo anidado simple", () => {
    it("debe crear un objeto con array de primitivos", () => {
      const model = stateObj({
        id: state("user-1"),
        tags: stateArray(() => state<string>()),
      });

      model.tags.set(["javascript", "typescript", "react"]);

      expect(model.get()).toEqual({
        id: "user-1",
        tags: ["javascript", "typescript", "react"],
      });
    });

    it("debe actualizar el array sin afectar otras propiedades", () => {
      const model = stateObj({
        id: state("user-1"),
        name: state("John"),
        scores: stateArray(() => state<number>()),
      });

      model.scores.set([10, 20, 30]);
      expect(model.get().scores).toEqual([10, 20, 30]);

      model.scores.set([15, 25]);
      expect(model.get()).toEqual({
        id: "user-1",
        name: "John",
        scores: [15, 25],
      });
    });

    it("debe permitir actualizar propiedades individuales del objeto", () => {
      const model = stateObj({
        id: state("user-1"),
        items: stateArray(() => state<number>()),
      });

      model.items.set([1, 2, 3]);
      model.id.set("user-2");

      expect(model.get()).toEqual({
        id: "user-2",
        items: [1, 2, 3],
      });
    });
  });

  describe("Modelo con array de objetos", () => {
    it("debe crear un array de objetos simples", () => {
      const model = stateObj({
        id: state("team-1"),
        agents: stateArray(() =>
          stateObj({
            name: state<string>(),
            age: state<number>(),
          })
        ),
      });

      model.agents.set([
        { name: "Alice", age: 25 },
        { name: "Bob", age: 30 },
        { name: "Charlie", age: 35 },
      ]);

      expect(model.get()).toEqual({
        id: "team-1",
        agents: [
          { name: "Alice", age: 25 },
          { name: "Bob", age: 30 },
          { name: "Charlie", age: 35 },
        ],
      });
    });

    it("debe actualizar un agente específico", () => {
      const model = stateObj({
        id: state("team-1"),
        agents: stateArray(() =>
          stateObj({
            name: state<string>(),
            age: state<number>(),
          })
        ),
      });

      model.agents.set([
        { name: "Alice", age: 25 },
        { name: "Bob", age: 30 },
      ]);

      // Actualizar el segundo agente usando set en el objeto completo
      model.agents.map((agent, index) => {
        if (index === 1) {
          agent.set({ name: "Robert", age: 31 });
        }
      });

      expect(model.get().agents[1]).toEqual({
        name: "Robert",
        age: 31,
      });
    });

    it("debe agregar nuevos agentes al array", () => {
      const model = stateObj({
        id: state("team-1"),
        agents: stateArray(() =>
          stateObj({
            name: state<string>(),
            age: state<number>(),
          })
        ),
      });

      model.agents.set([{ name: "Alice", age: 25 }]);
      expect(model.get().agents).toHaveLength(1);

      model.agents.set([
        { name: "Alice", age: 25 },
        { name: "Bob", age: 30 },
        { name: "Charlie", age: 35 },
      ]);

      expect(model.get().agents).toHaveLength(3);
    });

    it("debe eliminar agentes reduciendo el array", () => {
      const model = stateObj({
        id: state("team-1"),
        agents: stateArray(() =>
          stateObj({
            name: state<string>(),
            age: state<number>(),
          })
        ),
      });

      model.agents.set([
        { name: "Alice", age: 25 },
        { name: "Bob", age: 30 },
        { name: "Charlie", age: 35 },
      ]);

      model.agents.set([{ name: "Alice", age: 25 }]);

      expect(model.get().agents).toHaveLength(1);
      expect(model.get().agents[0]).toEqual({ name: "Alice", age: 25 });
    });
  });

  describe("Modelo profundamente anidado", () => {
    it("debe crear una estructura de tres niveles", () => {
      const model = stateObj({
        company: state("TechCorp"),
        departments: stateArray(() =>
          stateObj({
            name: state<string>(),
            employees: stateArray(() =>
              stateObj({
                id: state<string>(),
                name: state<string>(),
                salary: state<number>(),
              })
            ),
          })
        ),
      });

      model.departments.set([
        {
          name: "Engineering",
          employees: [
            { id: "e1", name: "Alice", salary: 80000 },
            { id: "e2", name: "Bob", salary: 85000 },
          ],
        },
        {
          name: "Sales",
          employees: [{ id: "s1", name: "Charlie", salary: 70000 }],
        },
      ]);

      const result = model.get();
      expect(result.company).toBe("TechCorp");
      expect(result.departments).toHaveLength(2);
      expect(result.departments[0].name).toBe("Engineering");
      expect(result.departments[0].employees).toHaveLength(2);
      expect(result.departments[1].employees).toHaveLength(1);
    });

    it("debe actualizar un empleado específico en un departamento específico", () => {
      const model = stateObj({
        company: state("TechCorp"),
        departments: stateArray(() =>
          stateObj({
            name: state<string>(),
            employees: stateArray(() =>
              stateObj({
                id: state<string>(),
                name: state<string>(),
                salary: state<number>(),
              })
            ),
          })
        ),
      });

      model.departments.set([
        {
          name: "Engineering",
          employees: [
            { id: "e1", name: "Alice", salary: 80000 },
            { id: "e2", name: "Bob", salary: 85000 },
          ],
        },
      ]);

      // Actualizar el salario de Bob
      const currentDepts = model.departments.peek();
      model.departments.set([
        {
          name: currentDepts[0].name,
          employees: [
            currentDepts[0].employees[0],
            { ...currentDepts[0].employees[1], salary: 90000 },
          ],
        },
      ]);

      expect(model.get().departments[0].employees[1].salary).toBe(90000);
    });

    it("debe agregar un nuevo departamento con empleados", () => {
      const model = stateObj({
        company: state("TechCorp"),
        departments: stateArray(() =>
          stateObj({
            name: state<string>(),
            employees: stateArray(() =>
              stateObj({
                id: state<string>(),
                name: state<string>(),
                salary: state<number>(),
              })
            ),
          })
        ),
      });

      model.departments.set([
        {
          name: "Engineering",
          employees: [{ id: "e1", name: "Alice", salary: 80000 }],
        },
      ]);

      model.departments.set([
        {
          name: "Engineering",
          employees: [{ id: "e1", name: "Alice", salary: 80000 }],
        },
        {
          name: "Marketing",
          employees: [
            { id: "m1", name: "David", salary: 65000 },
            { id: "m2", name: "Eve", salary: 68000 },
          ],
        },
      ]);

      expect(model.get().departments).toHaveLength(2);
      expect(model.get().departments[1].name).toBe("Marketing");
      expect(model.get().departments[1].employees).toHaveLength(2);
    });
  });

  describe("Reactividad con modelos complejos", () => {
    it("debe reaccionar a cambios en propiedades anidadas", () => {
      const model = stateObj({
        id: state("user-1"),
        agents: stateArray(() =>
          stateObj({
            name: state<string>(),
            age: state<number>(),
          })
        ),
      });

      model.agents.set([{ name: "Alice", age: 25 }]);

      const spy = vi.fn();
      const dispose = monitor(() => {
        const data = model.get();
        spy(data);
      });

      // Limpiar las llamadas iniciales
      spy.mockClear();

      // Cambiar una propiedad del agente
      model.agents.set([{ name: "Alice", age: 26 }]);

      expect(spy).toHaveBeenCalled();
      expect(spy).toHaveBeenLastCalledWith({
        id: "user-1",
        agents: [{ name: "Alice", age: 26 }],
      });

      dispose();
    });

    it("debe reaccionar a cambios en el array completo", () => {
      const model = stateObj({
        id: state("team-1"),
        members: stateArray(() =>
          stateObj({
            name: state<string>(),
            active: state<boolean>(),
          })
        ),
      });

      model.members.set([{ name: "Alice", active: true }]);

      const spy = vi.fn();
      const dispose = monitor(() => {
        const data = model.get();
        spy(data);
      });

      expect(spy).toHaveBeenCalledTimes(1);

      // Agregar más miembros
      model.members.set([
        { name: "Alice", active: true },
        { name: "Bob", active: false },
      ]);

      expect(spy).toHaveBeenCalledTimes(2);
      expect(spy).toHaveBeenLastCalledWith({
        id: "team-1",
        members: [
          { name: "Alice", active: true },
          { name: "Bob", active: false },
        ],
      });

      dispose();
    });

    it("debe usar calc para valores derivados en modelos complejos", () => {
      const model = stateObj({
        id: state("team-1"),
        agents: stateArray(() =>
          stateObj({
            name: state<string>(),
            age: state<number>(),
          })
        ),
      });

      model.agents.set([
        { name: "Alice", age: 25 },
        { name: "Bob", age: 30 },
        { name: "Charlie", age: 35 },
      ]);

      const averageAge = calc(() => {
        const agents = model.agents.get();
        if (agents.length === 0) return 0;
        const sum = agents.reduce((acc, agent) => acc + agent.age, 0);
        return sum / agents.length;
      });

      expect(averageAge.get()).toBe(30);

      // Actualizar una edad
      const currentAgents = model.agents.peek();
      model.agents.set([
        currentAgents[0],
        currentAgents[1],
        { name: "Charlie", age: 40 },
      ]);

      expect(averageAge.get()).toBe(31.666666666666668);
    });

    it("debe calcular valores derivados de estructuras profundas", () => {
      const model = stateObj({
        company: state("TechCorp"),
        departments: stateArray(() =>
          stateObj({
            name: state<string>(),
            budget: state<number>(),
            employees: stateArray(() =>
              stateObj({
                name: state<string>(),
                salary: state<number>(),
              })
            ),
          })
        ),
      });

      model.departments.set([
        {
          name: "Engineering",
          budget: 500000,
          employees: [
            { name: "Alice", salary: 80000 },
            { name: "Bob", salary: 85000 },
          ],
        },
        {
          name: "Sales",
          budget: 300000,
          employees: [{ name: "Charlie", salary: 70000 }],
        },
      ]);

      const totalPayroll = calc(() => {
        const departments = model.departments.get();
        return departments.reduce((total, dept) => {
          const deptTotal = dept.employees.reduce(
            (sum, emp) => sum + emp.salary,
            0
          );
          return total + deptTotal;
        }, 0);
      });

      expect(totalPayroll.get()).toBe(235000);

      // Agregar un nuevo empleado
      const currentDepts = model.departments.peek();
      currentDepts[0].employees.push({ name: "David", salary: 90000 });
      model.departments.set(
        currentDepts.map((dept) => ({
          name: dept.name,
          budget: dept.budget,
          employees: dept.employees,
        }))
      );

      expect(totalPayroll.get()).toBe(325000);
    });
  });

  describe("Operaciones complejas sobre arrays anidados", () => {
    it("debe filtrar elementos basándose en propiedades anidadas", () => {
      const model = stateObj({
        users: stateArray(() =>
          stateObj({
            id: state<string>(),
            name: state<string>(),
            active: state<boolean>(),
            role: state<string>(),
          })
        ),
      });

      model.users.set([
        { id: "1", name: "Alice", active: true, role: "admin" },
        { id: "2", name: "Bob", active: false, role: "user" },
        { id: "3", name: "Charlie", active: true, role: "user" },
        { id: "4", name: "David", active: true, role: "admin" },
      ]);

      const activeAdmins = calc(() => {
        return model.users
          .get()
          .filter((user) => user.active && user.role === "admin");
      });

      expect(activeAdmins.get()).toHaveLength(2);
      expect(activeAdmins.get()[0].name).toBe("Alice");
      expect(activeAdmins.get()[1].name).toBe("David");
    });

    it("debe transformar y mapear datos anidados", () => {
      const model = stateObj({
        products: stateArray(() =>
          stateObj({
            id: state<string>(),
            name: state<string>(),
            price: state<number>(),
            quantity: state<number>(),
          })
        ),
      });

      model.products.set([
        { id: "p1", name: "Laptop", price: 1000, quantity: 5 },
        { id: "p2", name: "Mouse", price: 50, quantity: 20 },
        { id: "p3", name: "Keyboard", price: 100, quantity: 15 },
      ]);

      const inventory = calc(() => {
        return model.products.get().map((product) => ({
          name: product.name,
          totalValue: product.price * product.quantity,
        }));
      });

      expect(inventory.get()).toEqual([
        { name: "Laptop", totalValue: 5000 },
        { name: "Mouse", totalValue: 1000 },
        { name: "Keyboard", totalValue: 1500 },
      ]);
    });

    it("debe ordenar elementos basándose en múltiples criterios", () => {
      const model = stateObj({
        tasks: stateArray(() =>
          stateObj({
            id: state<string>(),
            title: state<string>(),
            priority: state<number>(),
            completed: state<boolean>(),
          })
        ),
      });

      model.tasks.set([
        { id: "t1", title: "Task 1", priority: 2, completed: false },
        { id: "t2", title: "Task 2", priority: 1, completed: true },
        { id: "t3", title: "Task 3", priority: 3, completed: false },
        { id: "t4", title: "Task 4", priority: 1, completed: false },
      ]);

      const sortedTasks = calc(() => {
        return model.tasks
          .get()
          .slice()
          .sort((a, b) => {
            if (a.completed !== b.completed) {
              return a.completed ? 1 : -1;
            }
            return b.priority - a.priority;
          });
      });

      const sorted = sortedTasks.get();
      expect(sorted[0].id).toBe("t3");
      expect(sorted[1].id).toBe("t1");
      expect(sorted[2].id).toBe("t4");
      expect(sorted[3].id).toBe("t2");
    });
  });

  describe("Casos de uso complejos del mundo real", () => {
    it("debe gestionar un carrito de compras con productos y cantidades", () => {
      const cart = stateObj({
        userId: state("user-123"),
        items: stateArray(() =>
          stateObj({
            productId: state<string>(),
            name: state<string>(),
            price: state<number>(),
            quantity: state<number>(),
          })
        ),
        discount: state<number>(0),
      });

      cart.items.set([
        { productId: "p1", name: "Laptop", price: 1000, quantity: 1 },
        { productId: "p2", name: "Mouse", price: 50, quantity: 2 },
      ]);

      const subtotal = calc(() => {
        return cart.items
          .get()
          .reduce((sum, item) => sum + item.price * item.quantity, 0);
      });

      const total = calc(() => {
        const sub = subtotal.get();
        const disc = cart.discount.get();
        return sub - sub * (disc / 100);
      });

      expect(subtotal.get()).toBe(1100);
      expect(total.get()).toBe(1100);

      // Aplicar descuento
      cart.discount.set(10);
      expect(total.get()).toBe(990);

      // Incrementar cantidad del mouse
      const currentItems = cart.items.peek();
      cart.items.set([currentItems[0], { ...currentItems[1], quantity: 3 }]);

      expect(subtotal.get()).toBe(1150);
      expect(total.get()).toBe(1035);
    });

    it("debe gestionar un sistema de comentarios con respuestas anidadas", () => {
      const post = stateObj({
        id: state("post-1"),
        title: state("Mi Post"),
        comments: stateArray(() =>
          stateObj({
            id: state<string>(),
            author: state<string>(),
            text: state<string>(),
            likes: state<number>(),
            replies: stateArray(() =>
              stateObj({
                id: state<string>(),
                author: state<string>(),
                text: state<string>(),
              })
            ),
          })
        ),
      });

      post.comments.set([
        {
          id: "c1",
          author: "Alice",
          text: "Great post!",
          likes: 5,
          replies: [
            { id: "r1", author: "Bob", text: "I agree!" },
            { id: "r2", author: "Charlie", text: "Me too!" },
          ],
        },
        {
          id: "c2",
          author: "David",
          text: "Interesting",
          likes: 3,
          replies: [],
        },
      ]);

      const totalEngagement = calc(() => {
        const comments = post.comments.get();
        return comments.reduce((total, comment) => {
          return total + comment.likes + comment.replies.length;
        }, 0);
      });

      expect(totalEngagement.get()).toBe(10); // 5 + 2 + 3 + 0

      // Agregar un like al primer comentario
      let currentComments = post.comments.peek();
      post.comments.set([
        { ...currentComments[0], likes: 6 },
        currentComments[1],
      ]);

      expect(totalEngagement.get()).toBe(11);

      // Agregar una respuesta al segundo comentario
      currentComments = post.comments.peek();
      currentComments[1].replies.push({
        id: "r3",
        author: "Eve",
        text: "Nice point!",
      });
      post.comments.set(
        currentComments.map((c) => ({
          id: c.id,
          author: c.author,
          text: c.text,
          likes: c.likes,
          replies: c.replies,
        }))
      );

      expect(totalEngagement.get()).toBe(12);
    });

    it("debe gestionar un sistema de tareas con subtareas y etiquetas", () => {
      const project = stateObj({
        id: state("proj-1"),
        name: state("Proyecto Alpha"),
        tasks: stateArray(() =>
          stateObj({
            id: state<string>(),
            title: state<string>(),
            completed: state<boolean>(),
            tags: stateArray(() => state<string>()),
            subtasks: stateArray(() =>
              stateObj({
                id: state<string>(),
                title: state<string>(),
                completed: state<boolean>(),
              })
            ),
          })
        ),
      });

      project.tasks.set([
        {
          id: "t1",
          title: "Diseñar UI",
          completed: false,
          tags: ["design", "frontend"],
          subtasks: [
            { id: "st1", title: "Mockups", completed: true },
            { id: "st2", title: "Prototipo", completed: false },
          ],
        },
        {
          id: "t2",
          title: "Configurar DB",
          completed: false,
          tags: ["backend", "database"],
          subtasks: [
            { id: "st3", title: "Esquema", completed: true },
            { id: "st4", title: "Migraciones", completed: true },
          ],
        },
      ]);

      const progress = calc(() => {
        const tasks = project.tasks.get();
        let completed = 0;
        let total = 0;

        tasks.forEach((task) => {
          total++;
          if (task.completed) completed++;

          task.subtasks.forEach((subtask) => {
            total++;
            if (subtask.completed) completed++;
          });
        });

        return total === 0 ? 0 : (completed / total) * 100;
      });

      expect(progress.get()).toBe(50); // 3 de 6 completadas

      // Completar una subtarea
      const currentTasks = project.tasks.peek();
      const task0 = currentTasks[0];
      const subtasks0 = task0.subtasks;
      project.tasks.set([
        {
          ...task0,
          subtasks: [subtasks0[0], { ...subtasks0[1], completed: true }],
        },
        currentTasks[1],
      ]);

      expect(progress.get()).toBeCloseTo(66.67, 1);
    });

    it("debe gestionar un formulario dinámico con validaciones", () => {
      const form = stateObj({
        fields: stateArray(() =>
          stateObj({
            id: state<string>(),
            name: state<string>(),
            value: state<string>(),
            required: state<boolean>(),
            type: state<string>(),
          })
        ),
      });

      form.fields.set([
        { id: "f1", name: "email", value: "", required: true, type: "email" },
        {
          id: "f2",
          name: "username",
          value: "",
          required: true,
          type: "text",
        },
        { id: "f3", name: "bio", value: "", required: false, type: "textarea" },
      ]);

      const isValid = calc(() => {
        const fields = form.fields.get();
        return fields.every((field) => {
          if (!field.required) return true;
          return field.value.trim().length > 0;
        });
      });

      expect(isValid.get()).toBe(false);

      // Llenar campos requeridos
      const currentFields = form.fields.peek();
      form.fields.set([
        { ...currentFields[0], value: "user@example.com" },
        { ...currentFields[1], value: "johndoe" },
        currentFields[2],
      ]);

      expect(isValid.get()).toBe(true);

      // Vaciar un campo requerido
      const fields2 = form.fields.peek();
      form.fields.set([{ ...fields2[0], value: "" }, fields2[1], fields2[2]]);

      expect(isValid.get()).toBe(false);
    });
  });

  describe("Rendimiento y optimización", () => {
    it("debe manejar arrays grandes eficientemente", () => {
      const model = stateObj({
        items: stateArray(() =>
          stateObj({
            id: state<string>(),
            value: state<number>(),
          })
        ),
      });

      const largeArray = Array.from({ length: 1000 }, (_, i) => ({
        id: `item-${i}`,
        value: i,
      }));

      const start = performance.now();
      model.items.set(largeArray);
      const end = performance.now();

      expect(end - start).toBeLessThan(100); // Debe tardar menos de 100ms
      expect(model.items.get()).toHaveLength(1000);
    });

    it("debe actualizar elementos individuales sin reconstruir todo el array", () => {
      const model = stateObj({
        items: stateArray(() =>
          stateObj({
            id: state<string>(),
            count: state<number>(),
          })
        ),
      });

      model.items.set([
        { id: "a", count: 0 },
        { id: "b", count: 0 },
        { id: "c", count: 0 },
      ]);

      const spy = vi.fn();
      const dispose = monitor(() => {
        const items = model.items.get();
        spy(items);
      });

      // Limpiar las llamadas iniciales
      spy.mockClear();

      // Actualizar solo un elemento
      const currentItems = model.items.peek();
      model.items.set([
        currentItems[0],
        { ...currentItems[1], count: 5 },
        currentItems[2],
      ]);

      expect(spy).toHaveBeenCalled();
      expect(model.items.get()[1].count).toBe(5);

      dispose();
    });

    it("debe usar peek() para lecturas no reactivas", () => {
      const model = stateObj({
        data: stateArray(() =>
          stateObj({
            value: state<number>(),
          })
        ),
      });

      model.data.set([{ value: 1 }, { value: 2 }, { value: 3 }]);

      const spy = vi.fn();
      const dispose = monitor(() => {
        // peek() no debería crear suscripciones
        const peeked = model.data.peek();
        spy(peeked);
      });

      expect(spy).toHaveBeenCalledTimes(1);

      // Actualizar datos
      const currentData = model.data.peek();
      model.data.set([
        { ...currentData[0], value: 10 },
        currentData[1],
        currentData[2],
      ]);

      // No debería disparar el monitor porque usamos peek()
      expect(spy).toHaveBeenCalledTimes(1);

      dispose();
    });
  });

  describe("Casos extremos y edge cases", () => {
    it("debe manejar arrays vacíos correctamente", () => {
      const model = stateObj({
        id: state("test"),
        items: stateArray(() => state<number>()),
      });

      model.items.set([]);
      expect(model.get().items).toEqual([]);

      model.items.set([1, 2, 3]);
      expect(model.get().items).toEqual([1, 2, 3]);

      model.items.set([]);
      expect(model.get().items).toEqual([]);
    });

    it("debe manejar valores undefined y null en modelos complejos", () => {
      const model = stateObj({
        data: stateArray(() =>
          stateObj({
            id: state<string | null>(),
            value: state<number | undefined>(),
          })
        ),
      });

      model.data.set([
        { id: null, value: undefined },
        { id: "valid", value: 42 },
      ]);

      expect(model.get().data[0]).toEqual({ id: null, value: undefined });
      expect(model.get().data[1]).toEqual({ id: "valid", value: 42 });
    });

    it("debe manejar objetos con propiedades opcionales", () => {
      const model = stateObj({
        users: stateArray(() =>
          stateObj({
            id: state<string>(),
            name: state<string>(),
            email: state<string | undefined>(),
          })
        ),
      });

      model.users.set([
        { id: "1", name: "Alice", email: "alice@test.com" },
        { id: "2", name: "Bob", email: undefined },
      ]);

      expect(model.get().users[1].email).toBeUndefined();
    });

    it("debe limpiar correctamente con dispose()", () => {
      const model = stateObj({
        items: stateArray(() =>
          stateObj({
            value: state<number>(),
          })
        ),
      });

      model.items.set([{ value: 1 }, { value: 2 }]);
      expect(model.items.get()).toHaveLength(2);

      model.items.dispose();
      expect(model.items.get()).toHaveLength(0);
    });

    it("debe manejar cambios rápidos y consecutivos", () => {
      const model = stateObj({
        counter: state(0),
        items: stateArray(() => state<string>()),
      });

      for (let i = 0; i < 100; i++) {
        model.counter.set(i);
        model.items.set(Array.from({ length: i % 10 }, (_, j) => `item-${j}`));
      }

      expect(model.counter.get()).toBe(99);
      expect(model.items.get()).toHaveLength(9);
    });
  });

  describe("Integración con set() del objeto", () => {
    it("debe actualizar todo el objeto incluyendo arrays anidados", () => {
      const model = stateObj({
        id: state(""),
        tags: stateArray(() => state<string>()),
      });

      model.set({
        id: "new-id",
        tags: ["tag1", "tag2", "tag3"],
      });

      expect(model.get()).toEqual({
        id: "new-id",
        tags: ["tag1", "tag2", "tag3"],
      });
    });

    it("debe actualizar parcialmente sin afectar propiedades no especificadas", () => {
      const model = stateObj({
        id: state("original-id"),
        name: state("Original Name"),
        items: stateArray(() => state<number>()),
      });

      model.items.set([1, 2, 3]);

      model.set({
        name: "Updated Name",
      });

      expect(model.get()).toEqual({
        id: "original-id",
        name: "Updated Name",
        items: [1, 2, 3],
      });
    });

    it("debe funcionar con objetos anidados complejos en set()", () => {
      const model = stateObj({
        user: state(""),
        metadata: stateObj({
          created: state<Date | null>(null),
          updated: state<Date | null>(null),
        }),
        tags: stateArray(() => state<string>()),
      });

      const now = new Date();
      model.set({
        user: "john",
        metadata: {
          created: now,
          updated: now,
        },
        tags: ["important", "urgent"],
      });

      const result = model.get();
      expect(result.user).toBe("john");
      expect(result.metadata.created).toBe(now);
      expect(result.tags).toEqual(["important", "urgent"]);
    });
  });
});
