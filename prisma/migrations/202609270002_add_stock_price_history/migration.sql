CREATE TABLE `stock_price_history` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `stock_id` INTEGER NOT NULL,
    `trade_date` DATE NOT NULL,
    `closing_price` DECIMAL(19, 4) NOT NULL,
    `daily_change` DECIMAL(9, 4) NOT NULL DEFAULT 0,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `stock_price_history_stock_id_trade_date_key`(`stock_id`, `trade_date`),
    INDEX `stock_price_history_stock_id_trade_date_idx`(`stock_id`, `trade_date`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `stock_price_history` ADD CONSTRAINT `stock_price_history_stock_id_fkey` FOREIGN KEY (`stock_id`) REFERENCES `stocks`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
