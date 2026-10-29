export class QueryTimeoutError extends Error {
  constructor() {
    super("Завантаження перевищило час очікування. Спробуй ще раз.");
    this.name = "QueryTimeoutError";
  }
}

// Лише для читання: пізній результат не повертається в кеш після timeout.
// Мутації не обмежуємо цим helper, бо сервер міг уже зберегти зміни.
export async function withQueryTimeout<T>(
  load: () => PromiseLike<T>,
  timeoutMs = 20_000
): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      Promise.resolve().then(load),
      new Promise<never>((_resolve, reject) => {
        timer = setTimeout(() => reject(new QueryTimeoutError()), timeoutMs);
      }),
    ]);
  } finally {
    clearTimeout(timer);
  }
}
