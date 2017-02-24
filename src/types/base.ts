import { Result } from '../result'
import { Union2, Intersect2, Constraint, Union, Intersect } from '../index'
import showType from '../showType'

/**
 * A runtype determines at runtime whether a value conforms to a type specification.
 */
export interface Runtype<A> {
  /**
   * Verifies that a value conforms to this runtype. If so, returns the same value,
   * statically typed. Otherwise throws an exception.
   */
  check(x: any): A

  /**
   * Validates that a value conforms to this type, and returns a result indicating
   * success or failure (does not throw).
   */
  validate(x: any): Result<A>

  /**
   * A type guard for this runtype.
   */
  guard(x: any): x is A

  /**
   * Union this Runtype with another.
   */
  Or<B extends Rt>(B: B): Union2<this, B>

  /**
   * Intersect this Runtype with another.
   */
  And<B extends Rt>(B: B): Intersect2<this, B>

  /**
   * Provide a function which validates some arbitrary constraint,
   * returning true if the constraint is met, false if it failed
   * for some reason. May also return a string which indicates an
   * error and provides a descriptive message.
   */
  withConstraint(constraint: (x: A) => boolean | string): Constraint<this>

  /* @internal */ _falseWitness: A
}

/**
 * Just a convenient synonym for internal use in defining new Runtypes.
 */
export type Rt = Runtype<any>

/**
 * Obtains the static type associated with a Runtype.
 */
export type Static<R extends Rt> = R['_falseWitness']

export function runtype<A extends Rt>(check: (x: {}) => Static<A>, A: any): A {

  A.check = check
  A.validate = validate
  A.guard = guard
  A.Or = Or
  A.And = And
  A.withConstraint = withConstraint
  A.toString = () => showType(A)

  return A

  function validate(value: any): Result<A> {
    try {
      check(value)
      return { success: true, value }
    } catch ({ message }) {
      return { success: false, message }
    }
  }

  function guard(x: any): x is A {
    return validate(x).success
  }

  function Or<B extends Rt>(B: B): Union2<A, B> {
    return Union(A, B)
  }

  function And<B extends Rt>(B: B): Intersect2<A, B> {
    return Intersect(A, B)
  }

  function withConstraint(constraint: (x: A) => boolean | string): Constraint<A> {
    return Constraint(A, constraint)
  }
}

export class ValidationError extends Error {
  constructor(message: string) {
    super(message)
  }
}
