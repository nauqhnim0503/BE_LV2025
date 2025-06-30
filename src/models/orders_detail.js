'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Orders_detail extends Model {
    static associate(models) {
    // Một chi tiết đơn hàng thuộc về một đơn hàng
    Orders_detail.belongsTo(models.Orders, {
      foreignKey: 'order_id',
      as: 'order',
    });
    Orders_detail.belongsTo(models.Products, {
      foreignKey: 'product_id',
      as: 'product'
    });
    Orders_detail.belongsTo(models.Product_variants, {
      foreignKey: 'product_variant_id',
      as: 'product_variant'
    });
  }    
}

  Orders_detail.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      order_id: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      product_id: {               
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      product_variant_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      quantity: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      price: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      
      createdAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      updatedAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: 'Orders_detail', // tên model
      tableName: 'Orders_detail', // tên bảng trong database
      timestamps: true,        // tự thêm createdAt, updatedAt nếu true
    }
  );

  return Orders_detail;
};
