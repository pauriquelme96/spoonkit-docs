import { describe, it, expect, vi } from "vitest";
import { stateObj } from "./stateObj";
import { stateArray } from "./stateArr";
import { state } from "./State";
import { calc } from "./Calc";
import { monitor } from "./Monitor";

describe("Pruebas de Integración - Casos de Uso Reales", () => {
  describe("Sistema de gestión de proyectos", () => {
    it("debe gestionar un proyecto completo con equipos, tareas y miembros", () => {
      const project = stateObj({
        id: state("proj-001"),
        name: state("Spoonkit Framework"),
        status: state<"planning" | "active" | "completed">("active"),
        teams: stateArray(() =>
          stateObj({
            id: state<string>(),
            name: state<string>(),
            members: stateArray(() =>
              stateObj({
                id: state<string>(),
                name: state<string>(),
                role: state<string>(),
                hoursPerWeek: state<number>(),
              })
            ),
            tasks: stateArray(() =>
              stateObj({
                id: state<string>(),
                title: state<string>(),
                assignedTo: state<string>(),
                estimatedHours: state<number>(),
                completedHours: state<number>(),
                status: state<"pending" | "in-progress" | "done">(),
              })
            ),
          })
        ),
      });

      // Configurar el proyecto
      project.name.set("Spoonkit Framework");
      project.teams.set([
        {
          id: "team-frontend",
          name: "Frontend Team",
          members: [
            {
              id: "m1",
              name: "Alice",
              role: "Developer",
              hoursPerWeek: 40,
            },
            { id: "m2", name: "Bob", role: "Designer", hoursPerWeek: 30 },
          ],
          tasks: [
            {
              id: "t1",
              title: "Implementar UI",
              assignedTo: "m1",
              estimatedHours: 40,
              completedHours: 20,
              status: "in-progress",
            },
            {
              id: "t2",
              title: "Diseñar mockups",
              assignedTo: "m2",
              estimatedHours: 20,
              completedHours: 20,
              status: "done",
            },
          ],
        },
        {
          id: "team-backend",
          name: "Backend Team",
          members: [
            {
              id: "m3",
              name: "Charlie",
              role: "Developer",
              hoursPerWeek: 40,
            },
          ],
          tasks: [
            {
              id: "t3",
              title: "API REST",
              assignedTo: "m3",
              estimatedHours: 60,
              completedHours: 0,
              status: "pending",
            },
          ],
        },
      ]);

      // Calcular estadísticas del proyecto
      const totalMembers = calc(() => {
        return project.teams
          .get()
          .reduce((sum, team) => sum + team.members.length, 0);
      });

      const totalTasks = calc(() => {
        return project.teams
          .get()
          .reduce((sum, team) => sum + team.tasks.length, 0);
      });

      const completedTasks = calc(() => {
        return project.teams.get().reduce((sum, team) => {
          return (
            sum + team.tasks.filter((task) => task.status === "done").length
          );
        }, 0);
      });

      const projectProgress = calc(() => {
        const total = totalTasks.get();
        const completed = completedTasks.get();
        return total === 0 ? 0 : Math.round((completed / total) * 100);
      });

      const totalBudget = calc(() => {
        return project.teams.get().reduce((teamSum, team) => {
          const membersCost = team.members.reduce(
            (sum, m) => sum + m.hoursPerWeek * 50,
            0
          ); // $50/hora
          return teamSum + membersCost;
        }, 0);
      });

      // Verificar estadísticas iniciales
      expect(totalMembers.get()).toBe(3);
      expect(totalTasks.get()).toBe(3);
      expect(completedTasks.get()).toBe(1);
      expect(projectProgress.get()).toBe(33);
      expect(totalBudget.get()).toBe(5500); // (40*50 + 30*50 + 40*50)

      // Completar una tarea
      const teams = project.teams.peek();
      project.teams.set([
        {
          ...teams[0],
          tasks: [
            { ...teams[0].tasks[0], status: "done", completedHours: 40 },
            teams[0].tasks[1],
          ],
        },
        teams[1],
      ]);

      expect(completedTasks.get()).toBe(2);
      expect(projectProgress.get()).toBe(67);
    });

    it("debe manejar reasignación de tareas entre equipos", () => {
      const project = stateObj({
        id: state("proj-002"),
        teams: stateArray(() =>
          stateObj({
            id: state<string>(),
            name: state<string>(),
            tasks: stateArray(() =>
              stateObj({
                id: state<string>(),
                title: state<string>(),
                priority: state<number>(),
              })
            ),
          })
        ),
      });

      project.teams.set([
        {
          id: "t1",
          name: "Team A",
          tasks: [
            { id: "task1", title: "Task 1", priority: 1 },
            { id: "task2", title: "Task 2", priority: 2 },
          ],
        },
        {
          id: "t2",
          name: "Team B",
          tasks: [{ id: "task3", title: "Task 3", priority: 3 }],
        },
      ]);

      const teamATasks = calc(() => project.teams.get()[0]?.tasks.length || 0);
      const teamBTasks = calc(() => project.teams.get()[1]?.tasks.length || 0);

      expect(teamATasks.get()).toBe(2);
      expect(teamBTasks.get()).toBe(1);

      // Mover una tarea de Team A a Team B
      const teams = project.teams.peek();
      const taskToMove = teams[0].tasks[1];
      project.teams.set([
        {
          ...teams[0],
          tasks: [teams[0].tasks[0]], // Solo mantener task1
        },
        {
          ...teams[1],
          tasks: [...teams[1].tasks, taskToMove], // Agregar task2
        },
      ]);

      expect(teamATasks.get()).toBe(1);
      expect(teamBTasks.get()).toBe(2);
    });
  });

  describe("Sistema de e-commerce", () => {
    it("debe gestionar un catálogo de productos con categorías y variantes", () => {
      const store = stateObj({
        name: state("Tech Store"),
        categories: stateArray(() =>
          stateObj({
            id: state<string>(),
            name: state<string>(),
            products: stateArray(() =>
              stateObj({
                id: state<string>(),
                name: state<string>(),
                basePrice: state<number>(),
                stock: state<number>(),
                variants: stateArray(() =>
                  stateObj({
                    id: state<string>(),
                    name: state<string>(),
                    priceModifier: state<number>(),
                    stock: state<number>(),
                  })
                ),
              })
            ),
          })
        ),
      });

      store.categories.set([
        {
          id: "cat1",
          name: "Laptops",
          products: [
            {
              id: "p1",
              name: "MacBook Pro",
              basePrice: 2000,
              stock: 10,
              variants: [
                {
                  id: "v1",
                  name: "16GB RAM",
                  priceModifier: 0,
                  stock: 5,
                },
                {
                  id: "v2",
                  name: "32GB RAM",
                  priceModifier: 500,
                  stock: 5,
                },
              ],
            },
            {
              id: "p2",
              name: "Dell XPS",
              basePrice: 1500,
              stock: 15,
              variants: [
                {
                  id: "v3",
                  name: "8GB RAM",
                  priceModifier: -200,
                  stock: 10,
                },
                {
                  id: "v4",
                  name: "16GB RAM",
                  priceModifier: 0,
                  stock: 5,
                },
              ],
            },
          ],
        },
      ]);

      // Calcular inventario total
      const totalInventory = calc(() => {
        return store.categories.get().reduce((catSum, cat) => {
          return (
            catSum +
            cat.products.reduce((prodSum, prod) => {
              const variantsStock = prod.variants.reduce(
                (vSum, v) => vSum + v.stock,
                0
              );
              return prodSum + variantsStock;
            }, 0)
          );
        }, 0);
      });

      // Calcular valor total del inventario
      const totalInventoryValue = calc(() => {
        return store.categories.get().reduce((catSum, cat) => {
          return (
            catSum +
            cat.products.reduce((prodSum, prod) => {
              const variantsValue = prod.variants.reduce(
                (vSum, v) =>
                  vSum + (prod.basePrice + v.priceModifier) * v.stock,
                0
              );
              return prodSum + variantsValue;
            }, 0)
          );
        }, 0);
      });

      expect(totalInventory.get()).toBe(25); // 5+5+10+5
      expect(totalInventoryValue.get()).toBe(43000);
      // (2000*5 + 2500*5 + 1300*10 + 1500*5) = 10000 + 12500 + 13000 + 7500 = 43000

      // Realizar una venta
      const categories = store.categories.peek();
      const products = categories[0].products;
      store.categories.set([
        {
          ...categories[0],
          products: [
            {
              ...products[0],
              variants: [
                { ...products[0].variants[0], stock: 4 }, // Vendido 1
                products[0].variants[1],
              ],
            },
            products[1],
          ],
        },
      ]);

      expect(totalInventory.get()).toBe(24);
    });

    it("debe manejar un carrito de compras con aplicación de cupones", () => {
      const cart = stateObj({
        userId: state("user-123"),
        items: stateArray(() =>
          stateObj({
            productId: state<string>(),
            name: state<string>(),
            price: state<number>(),
            quantity: state<number>(),
            category: state<string>(),
          })
        ),
        coupons: stateArray(() =>
          stateObj({
            code: state<string>(),
            type: state<"percentage" | "fixed" | "category">(),
            value: state<number>(),
            category: state<string | null>(),
          })
        ),
      });

      cart.items.set([
        {
          productId: "p1",
          name: "Laptop",
          price: 1000,
          quantity: 1,
          category: "electronics",
        },
        {
          productId: "p2",
          name: "Mouse",
          price: 50,
          quantity: 2,
          category: "accessories",
        },
        {
          productId: "p3",
          name: "Keyboard",
          price: 100,
          quantity: 1,
          category: "accessories",
        },
      ]);

      cart.coupons.set([
        {
          code: "SAVE10",
          type: "percentage",
          value: 10,
          category: null,
        },
        {
          code: "ACC20",
          type: "category",
          value: 20,
          category: "accessories",
        },
      ]);

      const subtotal = calc(() => {
        return cart.items
          .get()
          .reduce((sum, item) => sum + item.price * item.quantity, 0);
      });

      const discounts = calc(() => {
        const items = cart.items.get();
        const coupons = cart.coupons.get();
        let totalDiscount = 0;

        coupons.forEach((coupon) => {
          if (coupon.type === "percentage") {
            totalDiscount += subtotal.get() * (coupon.value / 100);
          } else if (coupon.type === "category") {
            const categoryTotal = items
              .filter((item) => item.category === coupon.category)
              .reduce((sum, item) => sum + item.price * item.quantity, 0);
            totalDiscount += categoryTotal * (coupon.value / 100);
          }
        });

        return totalDiscount;
      });

      const total = calc(() => {
        return subtotal.get() - discounts.get();
      });

      expect(subtotal.get()).toBe(1200); // 1000 + 100 + 100
      expect(discounts.get()).toBe(160); // 10% de 1200 (120) + 20% de 200 (40)
      expect(total.get()).toBe(1040);
    });
  });

  describe("Sistema de gestión de contenido (CMS)", () => {
    it("debe gestionar artículos con categorías, tags y comentarios", () => {
      const cms = stateObj({
        articles: stateArray(() =>
          stateObj({
            id: state<string>(),
            title: state<string>(),
            content: state<string>(),
            author: state<string>(),
            status: state<"draft" | "published" | "archived">(),
            publishedAt: state<Date | null>(),
            views: state<number>(),
            tags: stateArray(() => state<string>()),
            comments: stateArray(() =>
              stateObj({
                id: state<string>(),
                author: state<string>(),
                text: state<string>(),
                approved: state<boolean>(),
                replies: stateArray(() =>
                  stateObj({
                    id: state<string>(),
                    author: state<string>(),
                    text: state<string>(),
                  })
                ),
              })
            ),
          })
        ),
      });

      const now = new Date();
      cms.articles.set([
        {
          id: "art1",
          title: "Getting Started with SpoonKit",
          content: "This is a tutorial...",
          author: "Alice",
          status: "published",
          publishedAt: now,
          views: 150,
          tags: ["tutorial", "beginner", "spoonkit"],
          comments: [
            {
              id: "c1",
              author: "Bob",
              text: "Great article!",
              approved: true,
              replies: [
                {
                  id: "r1",
                  author: "Alice",
                  text: "Thanks!",
                },
              ],
            },
            {
              id: "c2",
              author: "Charlie",
              text: "Spam message",
              approved: false,
              replies: [],
            },
          ],
        },
        {
          id: "art2",
          title: "Advanced Patterns",
          content: "Deep dive into...",
          author: "Bob",
          status: "published",
          publishedAt: now,
          views: 85,
          tags: ["advanced", "patterns", "spoonkit"],
          comments: [],
        },
        {
          id: "art3",
          title: "Draft Article",
          content: "Work in progress...",
          author: "Alice",
          status: "draft",
          publishedAt: null,
          views: 0,
          tags: ["draft"],
          comments: [],
        },
      ]);

      // Estadísticas
      const publishedArticles = calc(() => {
        return cms.articles.get().filter((art) => art.status === "published");
      });

      const totalViews = calc(() => {
        return cms.articles.get().reduce((sum, art) => sum + art.views, 0);
      });

      const approvedComments = calc(() => {
        return cms.articles.get().reduce((sum, art) => {
          return (
            sum + art.comments.filter((comment) => comment.approved).length
          );
        }, 0);
      });

      const totalEngagement = calc(() => {
        return cms.articles.get().reduce((sum, art) => {
          const commentCount = art.comments.reduce((cSum, comment) => {
            return cSum + 1 + comment.replies.length;
          }, 0);
          return sum + art.views + commentCount;
        }, 0);
      });

      expect(publishedArticles.get()).toHaveLength(2);
      expect(totalViews.get()).toBe(235);
      expect(approvedComments.get()).toBe(1);
      expect(totalEngagement.get()).toBe(238); // 235 views + 3 comments/replies

      // Aprobar un comentario
      const articles = cms.articles.peek();
      cms.articles.set([
        {
          ...articles[0],
          comments: [
            articles[0].comments[0],
            { ...articles[0].comments[1], approved: true },
          ],
        },
        articles[1],
        articles[2],
      ]);

      expect(approvedComments.get()).toBe(2);
    });
  });

  describe("Sistema de control de versiones", () => {
    it("debe gestionar commits, branches y merges", () => {
      const repo = stateObj({
        name: state("my-project"),
        branches: stateArray(() =>
          stateObj({
            name: state<string>(),
            commits: stateArray(() =>
              stateObj({
                hash: state<string>(),
                message: state<string>(),
                author: state<string>(),
                timestamp: state<Date>(),
                files: stateArray(() =>
                  stateObj({
                    path: state<string>(),
                    additions: state<number>(),
                    deletions: state<number>(),
                  })
                ),
              })
            ),
          })
        ),
      });

      const now = new Date();
      repo.branches.set([
        {
          name: "main",
          commits: [
            {
              hash: "abc123",
              message: "Initial commit",
              author: "Alice",
              timestamp: now,
              files: [
                { path: "README.md", additions: 10, deletions: 0 },
                { path: "src/index.ts", additions: 50, deletions: 0 },
              ],
            },
            {
              hash: "def456",
              message: "Add tests",
              author: "Bob",
              timestamp: now,
              files: [
                { path: "src/index.test.ts", additions: 100, deletions: 0 },
              ],
            },
          ],
        },
        {
          name: "feature/new-feature",
          commits: [
            {
              hash: "ghi789",
              message: "Implement feature",
              author: "Charlie",
              timestamp: now,
              files: [
                { path: "src/feature.ts", additions: 200, deletions: 0 },
                { path: "src/index.ts", additions: 20, deletions: 5 },
              ],
            },
          ],
        },
      ]);

      // Estadísticas
      const totalCommits = calc(() => {
        return repo.branches
          .get()
          .reduce((sum, branch) => sum + branch.commits.length, 0);
      });

      const totalAdditions = calc(() => {
        return repo.branches.get().reduce((branchSum, branch) => {
          return (
            branchSum +
            branch.commits.reduce((commitSum, commit) => {
              return (
                commitSum +
                commit.files.reduce((fileSum, file) => {
                  return fileSum + file.additions;
                }, 0)
              );
            }, 0)
          );
        }, 0);
      });

      const totalDeletions = calc(() => {
        return repo.branches.get().reduce((branchSum, branch) => {
          return (
            branchSum +
            branch.commits.reduce((commitSum, commit) => {
              return (
                commitSum +
                commit.files.reduce((fileSum, file) => {
                  return fileSum + file.deletions;
                }, 0)
              );
            }, 0)
          );
        }, 0);
      });

      const contributors = calc(() => {
        const authors = new Set<string>();
        repo.branches.get().forEach((branch) => {
          branch.commits.forEach((commit) => {
            authors.add(commit.author);
          });
        });
        return Array.from(authors);
      });

      expect(totalCommits.get()).toBe(3);
      expect(totalAdditions.get()).toBe(380); // 10+50+100+200+20
      expect(totalDeletions.get()).toBe(5);
      expect(contributors.get()).toHaveLength(3);
      expect(contributors.get()).toContain("Alice");
      expect(contributors.get()).toContain("Bob");
      expect(contributors.get()).toContain("Charlie");
    });
  });

  describe("Sistema de notificaciones", () => {
    it("debe gestionar notificaciones por tipo con prioridades", () => {
      const notifications = stateObj({
        items: stateArray(() =>
          stateObj({
            id: state<string>(),
            type: state<"info" | "warning" | "error" | "success">(),
            title: state<string>(),
            message: state<string>(),
            priority: state<number>(),
            read: state<boolean>(),
            timestamp: state<Date>(),
            actions: stateArray(() =>
              stateObj({
                id: state<string>(),
                label: state<string>(),
                url: state<string>(),
              })
            ),
          })
        ),
      });

      const now = new Date();
      notifications.items.set([
        {
          id: "n1",
          type: "error",
          title: "Build Failed",
          message: "The build process failed",
          priority: 5,
          read: false,
          timestamp: now,
          actions: [
            { id: "a1", label: "View Logs", url: "/logs" },
            { id: "a2", label: "Retry", url: "/retry" },
          ],
        },
        {
          id: "n2",
          type: "warning",
          title: "High Memory Usage",
          message: "Memory usage is at 85%",
          priority: 3,
          read: false,
          timestamp: now,
          actions: [{ id: "a3", label: "View Details", url: "/memory" }],
        },
        {
          id: "n3",
          type: "success",
          title: "Deploy Successful",
          message: "Version 1.0.0 deployed",
          priority: 1,
          read: true,
          timestamp: now,
          actions: [],
        },
        {
          id: "n4",
          type: "info",
          title: "Update Available",
          message: "New version available",
          priority: 2,
          read: false,
          timestamp: now,
          actions: [{ id: "a4", label: "Update Now", url: "/update" }],
        },
      ]);

      const unreadCount = calc(() => {
        return notifications.items.get().filter((n) => !n.read).length;
      });

      const highPriorityUnread = calc(() => {
        return notifications.items
          .get()
          .filter((n) => !n.read && n.priority >= 4);
      });

      const notificationsByType = calc(() => {
        const byType: Record<string, number> = {};
        notifications.items.get().forEach((n) => {
          byType[n.type] = (byType[n.type] || 0) + 1;
        });
        return byType;
      });

      expect(unreadCount.get()).toBe(3);
      expect(highPriorityUnread.get()).toHaveLength(1);
      expect(highPriorityUnread.get()[0].type).toBe("error");
      expect(notificationsByType.get()).toEqual({
        error: 1,
        warning: 1,
        success: 1,
        info: 1,
      });

      // Marcar una notificación como leída
      const items = notifications.items.peek();
      notifications.items.set([
        { ...items[0], read: true },
        items[1],
        items[2],
        items[3],
      ]);

      expect(unreadCount.get()).toBe(2);
      expect(highPriorityUnread.get()).toHaveLength(0);
    });
  });

  describe("Reactividad compleja en tiempo real", () => {
    it("debe propagar cambios a través de múltiples niveles de cálculos derivados", () => {
      const data = stateObj({
        users: stateArray(() =>
          stateObj({
            id: state<string>(),
            name: state<string>(),
            purchases: stateArray(() =>
              stateObj({
                productId: state<string>(),
                amount: state<number>(),
                quantity: state<number>(),
              })
            ),
          })
        ),
      });

      data.users.set([
        {
          id: "u1",
          name: "Alice",
          purchases: [
            { productId: "p1", amount: 100, quantity: 2 },
            { productId: "p2", amount: 50, quantity: 1 },
          ],
        },
        {
          id: "u2",
          name: "Bob",
          purchases: [{ productId: "p1", amount: 100, quantity: 1 }],
        },
      ]);

      // Nivel 1: Total por usuario
      const userTotals = calc(() => {
        return data.users.get().map((user) => ({
          userId: user.id,
          userName: user.name,
          total: user.purchases.reduce(
            (sum, p) => sum + p.amount * p.quantity,
            0
          ),
        }));
      });

      // Nivel 2: Total general
      const grandTotal = calc(() => {
        return userTotals.get().reduce((sum, u) => sum + u.total, 0);
      });

      // Nivel 3: Promedio por usuario
      const averagePerUser = calc(() => {
        const users = userTotals.get();
        return users.length === 0 ? 0 : grandTotal.get() / users.length;
      });

      // Nivel 4: Usuario con mayor gasto
      const topSpender = calc(() => {
        const users = userTotals.get();
        if (users.length === 0) return null;
        return users.reduce((max, user) =>
          user.total > max.total ? user : max
        );
      });

      expect(userTotals.get()).toEqual([
        { userId: "u1", userName: "Alice", total: 250 },
        { userId: "u2", userName: "Bob", total: 100 },
      ]);
      expect(grandTotal.get()).toBe(350);
      expect(averagePerUser.get()).toBe(175);
      expect(topSpender.get()?.userName).toBe("Alice");

      // Agregar una compra a Bob
      const users = data.users.peek();
      data.users.set([
        users[0],
        {
          ...users[1],
          purchases: [
            ...users[1].purchases,
            { productId: "p3", amount: 200, quantity: 1 },
          ],
        },
      ]);

      expect(grandTotal.get()).toBe(550);
      expect(averagePerUser.get()).toBe(275);
      expect(topSpender.get()?.userName).toBe("Bob");
    });

    it("debe manejar suscripciones múltiples y limpiarlas correctamente", () => {
      const model = stateObj({
        counter: state(0),
        items: stateArray(() => state<number>()),
      });

      model.items.set([1, 2, 3]);

      const spy1 = vi.fn();
      const spy2 = vi.fn();
      const spy3 = vi.fn();

      const dispose1 = monitor(() => {
        spy1(model.counter.get());
      });

      const dispose2 = monitor(() => {
        spy2(model.items.get());
      });

      const dispose3 = monitor(() => {
        spy3(model.get());
      });

      spy1.mockClear();
      spy2.mockClear();
      spy3.mockClear();

      // Cambiar el counter
      model.counter.set(1);
      expect(spy1).toHaveBeenCalled();
      expect(spy3).toHaveBeenCalled();

      spy1.mockClear();
      spy2.mockClear();
      spy3.mockClear();

      // Cambiar items
      model.items.set([4, 5, 6]);
      expect(spy2).toHaveBeenCalled();
      expect(spy3).toHaveBeenCalled();

      // Limpiar suscripciones
      dispose1();
      dispose2();
      dispose3();

      spy1.mockClear();
      spy2.mockClear();
      spy3.mockClear();

      // Los cambios no deberían disparar los spies
      model.counter.set(2);
      model.items.set([7, 8, 9]);

      expect(spy1).not.toHaveBeenCalled();
      expect(spy2).not.toHaveBeenCalled();
      expect(spy3).not.toHaveBeenCalled();
    });
  });

  describe("Casos extremos de rendimiento", () => {
    it("debe manejar actualizaciones masivas en estructuras profundamente anidadas", () => {
      const data = stateObj({
        regions: stateArray(() =>
          stateObj({
            id: state<string>(),
            cities: stateArray(() =>
              stateObj({
                id: state<string>(),
                buildings: stateArray(() =>
                  stateObj({
                    id: state<string>(),
                    floors: state<number>(),
                  })
                ),
              })
            ),
          })
        ),
      });

      // Crear una estructura grande
      const regions = Array.from({ length: 5 }, (_, ri) => ({
        id: `region-${ri}`,
        cities: Array.from({ length: 3 }, (_, ci) => ({
          id: `city-${ri}-${ci}`,
          buildings: Array.from({ length: 10 }, (_, bi) => ({
            id: `building-${ri}-${ci}-${bi}`,
            floors: Math.floor(Math.random() * 20) + 1,
          })),
        })),
      }));

      const start = performance.now();
      data.regions.set(regions);
      const end = performance.now();

      expect(end - start).toBeLessThan(100);

      // Calcular total de edificios
      const totalBuildings = calc(() => {
        return data.regions.get().reduce((rSum, region) => {
          return (
            rSum +
            region.cities.reduce((cSum, city) => {
              return cSum + city.buildings.length;
            }, 0)
          );
        }, 0);
      });

      expect(totalBuildings.get()).toBe(150); // 5 regions * 3 cities * 10 buildings
    });
  });
});
