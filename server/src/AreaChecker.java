public class AreaChecker {

    /**
     * Дефолтная валидация
     */
    public static void validate(double x, double y, double r) {
        if (r < 1 || r > 5) {
            throw new IllegalArgumentException("Радиус R должен быть числом из диапазона {1, 2, 3, 4, 5}");
        }

        boolean validX = (x == -3 || x == -2 || x == -1 || x == 0 || x == 1 || x == 2 || x == 3 || x == 4 || x == 5);

        if (!validX) {
            throw new IllegalArgumentException("Параметр X должен быть одним из значений: {-3, -2, -1, 0, 1, 2, 3, 4, 5}");
        }

        if (y <= -3 || y >= 5) {
            throw new IllegalArgumentException("Параметр Y должен находиться в диапазоне (-3 до 5)");
        }
    }

    /**
     * Чекаем по области
     * TODO: чекаем по варику, что там будет нужно в итоге
     */
    public static boolean isInside(double x, double y, double r) {
        // 1 четверть
        if (x >= 0 && y >= 0) {
            return (x * x + y * y) <= (r * r);
        }

        // 2 четверть
        if (x <= 0 && y >= 0) {
            return false;
        }

        // 3 четверть
        if (x <= 0 && y <= 0) {
            return (x >= -r) && (y >= -r);
        }
        // 4 четверть
        if (x >= 0 && y <= 0) {
            return (x <= r / 2) && (y >= (2 * x - r));
        }

        return false;
    }
}
