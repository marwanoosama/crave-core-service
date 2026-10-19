import {RestaurantNotFoundError, UnAuthorizedError} from "../../restaurant/errors";
import {ProductNotFoundError} from "../errors";
import {SystemRole} from "../../user/enums";
import {CreateProductDTO, UpdateProductDTO} from "../dto/product.dto";
import {createProduct, findProductById, findProductsByBranch, findProductsByRestaurant, updateProduct} from "../repository/product.repository";
import {findCategoryByName, findCategoriesByRestaurant, createCategory} from "../repository/category.repository";
import {updateBranchDetails} from "../repository/product-branch-details.repository";
import {findById} from "../../restaurant/repository/restaurant.repo";
import {db} from "../../../lib/knex/knex";
import {injectable} from "tsyringe";

@injectable()
export class ProductService {

    create = async (restaurantId: number, userId: number, userRole: SystemRole, data: CreateProductDTO) => {
        const restaurant = await findById(restaurantId);
        if (!restaurant) throw RestaurantNotFoundError;
        if (userRole !== SystemRole.SYSTEM_ADMIN && Number(restaurant.ownerId) !== Number(userId)) {
            throw UnAuthorizedError;
        }

        const trx = await db.transaction();
        try{
            let categoryId: number | null = null;
            if (data.categoryName) {
                let category = await findCategoryByName(restaurantId, data.categoryName, trx);
                if (!category) {
                    category = await createCategory(restaurantId, data.categoryName, trx);
                }
                categoryId = category.id;
            }

            const product = await createProduct({
                name: data.name,
                description: data.description,
                imageUrl: data.imageUrl,
                restaurantId,
                categoryId,
            }, trx);

            await trx.commit();

            return product;

        }catch(error){
            await trx.rollback();
            throw error;
        }
    }

    findByRestaurant = async (restaurantId: number, userId: number, userRole: SystemRole) => {
        const restaurant = await findById(restaurantId);
        if (!restaurant) throw RestaurantNotFoundError;
        if (userRole !== SystemRole.SYSTEM_ADMIN && Number(restaurant.ownerId) !== Number(userId)) {
            throw UnAuthorizedError;
        }
        return await findProductsByRestaurant(restaurantId);
    }

    findCategories = async (restaurantId: number) => {
        return await findCategoriesByRestaurant(restaurantId);
    }

    findByBranch = async (branchId: number) => {
        return await findProductsByBranch(branchId);
    }

    findById = async (id: number) => {
        const product = await findProductById(id);
        if (!product) {
            throw ProductNotFoundError;
        }
        return product;
    }

    update = async (productId: number, userId: number, userRole: SystemRole, data: UpdateProductDTO, branchId?: number) => {
        const product = await findProductById(productId);
        if (!product) {
            throw ProductNotFoundError;
        }

        const restaurant = await findById(product.restaurantId);
        if (!restaurant) throw RestaurantNotFoundError;
        if (userRole !== SystemRole.SYSTEM_ADMIN && Number(restaurant.ownerId) !== Number(userId)) {
            throw UnAuthorizedError;
        }

        const trx = await db.transaction();
        try {
            let categoryId: number | undefined = undefined;
            if (data.categoryName) {
                let category = await findCategoryByName(product.restaurantId, data.categoryName, trx);
                if (!category) {
                    category = await createCategory(product.restaurantId, data.categoryName, trx);
                }
                categoryId = category.id;
            }

            const updatedProduct = await updateProduct(productId, {
                name: data.name,
                description: data.description,
                imageUrl: data.imageUrl,
                categoryId,
            }, trx);

            let branchDetails;
            if (branchId && (data.price !== undefined || data.stock !== undefined || data.isAvailable !== undefined)) {
                branchDetails = await updateBranchDetails(branchId, productId, {
                    price: data.price,
                    stock: data.stock,
                    isAvailable: data.isAvailable,
                }, trx);
            }

            await trx.commit();

            return {product: updatedProduct, branchDetails};
        } catch (error) {
            await trx.rollback();
            throw error;
        }
    }
}

